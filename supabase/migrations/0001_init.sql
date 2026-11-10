-- Diecast Garage schema. Run once in the Supabase SQL editor (or `supabase db push`).
-- Access is enforced here with row level security, so the rules hold no matter what the website sends.

create extension if not exists pgcrypto;

-- ---------- tables ----------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 60),
  bio text check (char_length(bio) <= 500),
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

-- Billing lives apart from profiles so other people can never read it. Only the Stripe webhook writes it.
create table public.memberships (
  user_id uuid primary key references public.profiles on delete cascade,
  status text not null default 'none',
  stripe_customer_id text unique,
  stripe_subscription_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- Public details of a car. What the owner paid is in car_purchases, which only the owner can read.
create table public.cars (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  brand text check (char_length(brand) <= 60),
  scale text check (char_length(scale) <= 12),
  year text check (char_length(year) <= 12),
  description text check (char_length(description) <= 2000),
  boxed boolean not null default true,
  photo_path text,
  search_terms text check (char_length(search_terms) <= 200),
  for_sale boolean not null default false,
  ebay_url text,
  asking_price numeric(10,2) check (asking_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint for_sale_needs_ebay_link check (
    not for_sale or (
      ebay_url is not null and
      ebay_url ~* '^https://([a-z0-9-]+\.)*ebay\.(com|us|ca|co\.uk|com\.au|de|fr|it|es|ie|at|ch|nl|be|pl|com\.sg|com\.my|ph|in)/'
    )
  )
);
create index cars_owner_idx on public.cars (owner_id, created_at desc);
create index cars_for_sale_idx on public.cars (created_at desc) where for_sale;

create table public.car_purchases (
  car_id uuid primary key references public.cars on delete cascade,
  owner_id uuid not null default auth.uid() references public.profiles on delete cascade,
  paid numeric(10,2) check (paid >= 0),
  purchased_at date,
  manual_value numeric(10,2) check (manual_value >= 0)
);

-- Sold listings the owner logged to estimate a car's value. Owner only.
create table public.comps (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars on delete cascade,
  owner_id uuid not null default auth.uid() references public.profiles on delete cascade,
  price numeric(10,2) not null check (price > 0),
  source text not null default 'eBay' check (source in ('eBay', 'Facebook', 'Other')),
  sold_on date,
  url text check (char_length(url) <= 600),
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);
create index comps_car_idx on public.comps (car_id);

create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles on delete cascade,
  followee_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id);

-- A comment on someone's collection (car_id null) or on one car in it.
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles on delete cascade,
  car_id uuid references public.cars on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index comments_profile_idx on public.comments (profile_id, created_at desc);
create index comments_car_idx on public.comments (car_id, created_at desc);

-- ---------- helpers ----------

create or replace function public.is_member(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where user_id = uid and status in ('active', 'trialing'));
$$;

create or replace function public.can_view_collection(owner uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select owner = auth.uid() or exists (select 1 from profiles where id = owner and is_public);
$$;

-- Free accounts keep up to 5 cars; members have no limit. Keep in sync with FREE_CAR_LIMIT in src/lib/limits.ts.
create or replace function public.enforce_car_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_member(new.owner_id)
     and (select count(*) from cars where owner_id = new.owner_id) >= 5 then
    raise exception 'FREE_LIMIT' using
      hint = 'Free accounts can keep up to 5 cars. Become a member to add more.';
  end if;
  return new;
end $$;
create trigger cars_free_limit before insert on public.cars
  for each row execute function public.enforce_car_limit();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  new.owner_id = old.owner_id; -- a car can't be moved to someone else's collection
  return new;
end $$;
create trigger cars_touch before update on public.cars
  for each row execute function public.touch_updated_at();

-- Create the profile when someone signs up. The username comes from the sign-up form.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username, display_name)
  values (new.id, lower(new.raw_user_meta_data->>'username'), new.raw_user_meta_data->>'display_name');
  insert into memberships (user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- row level security ----------

alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.cars enable row level security;
alter table public.car_purchases enable row level security;
alter table public.comps enable row level security;
alter table public.follows enable row level security;
alter table public.comments enable row level security;

-- Profiles: anyone can see names, so private collectors still show up as a name with nothing inside.
create policy "profiles readable" on public.profiles for select using (true);
create policy "edit own profile" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from anon, authenticated;
grant update (display_name, bio, is_public) on public.profiles to authenticated;

create policy "read own membership" on public.memberships for select using (user_id = auth.uid());

create policy "cars visible with collection" on public.cars for select
  using (public.can_view_collection(owner_id));
create policy "add own cars" on public.cars for insert with check (owner_id = auth.uid());
create policy "edit own cars" on public.cars for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "delete own cars" on public.cars for delete using (owner_id = auth.uid());

create policy "own purchases" on public.car_purchases for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and exists (select 1 from public.cars c where c.id = car_id and c.owner_id = auth.uid()));

create policy "own comps" on public.comps for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and exists (select 1 from public.cars c where c.id = car_id and c.owner_id = auth.uid()));

create policy "follows readable" on public.follows for select using (true);
create policy "follow public collections" on public.follows for insert
  with check (follower_id = auth.uid() and exists (select 1 from public.profiles p where p.id = followee_id and p.is_public));
create policy "unfollow" on public.follows for delete using (follower_id = auth.uid());

create policy "comments visible with collection" on public.comments for select
  using (public.can_view_collection(profile_id));
create policy "comment on visible collections" on public.comments for insert
  with check (
    author_id = auth.uid()
    and public.can_view_collection(profile_id)
    and (car_id is null or exists (select 1 from public.cars c where c.id = car_id and c.owner_id = profile_id))
  );
-- Authors can remove their own comments; collectors can remove any comment on their collection.
create policy "remove comments" on public.comments for delete
  using (author_id = auth.uid() or profile_id = auth.uid());

-- ---------- photo storage ----------

insert into storage.buckets (id, name, public) values ('car-photos', 'car-photos', true)
on conflict (id) do nothing;

create policy "upload own photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'car-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "replace own photos" on storage.objects for update to authenticated
  using (bucket_id = 'car-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'car-photos' and (storage.foldername(name))[1] = auth.uid()::text);
