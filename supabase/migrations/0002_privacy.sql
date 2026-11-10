-- Release 0.2: privacy settings.
-- Full name moves to an owner-only table. Collectors choose whether to show their email and car values.
-- Price paid, gain/loss, purchase dates and logged sold listings stay owner-only (car_purchases, comps).

create table public.profile_private (
  id uuid primary key references public.profiles on delete cascade,
  full_name text check (char_length(full_name) <= 100)
);
alter table public.profile_private enable row level security;
create policy "own private profile" on public.profile_private for all
  using (id = auth.uid()) with check (id = auth.uid());

-- Names were public before 0.2. Move them out of the public profile.
insert into public.profile_private (id, full_name)
select id, display_name from public.profiles
on conflict (id) do nothing;
alter table public.profiles drop column display_name;

alter table public.profiles
  add column show_email boolean not null default false,
  add column show_values boolean not null default false;

revoke update on public.profiles from anon, authenticated;
grant update (bio, is_public, show_email, show_values) on public.profiles to authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username) values (new.id, lower(new.raw_user_meta_data->>'username'));
  insert into profile_private (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name'));
  insert into memberships (user_id) values (new.id);
  return new;
end $$;

-- A collector's email, only for themselves or when their public collection shows it.
create or replace function public.profile_email(p_profile uuid) returns text
language sql stable security definer set search_path = public, auth as $$
  select u.email from auth.users u join profiles p on p.id = u.id
  where u.id = p_profile and (p_profile = auth.uid() or (p.is_public and p.show_email));
$$;

-- Each car's value, only for the owner or when their public collection shows values.
-- Same rule as estimate() in src/lib/cars.ts: the collector's own value if set, otherwise the median of
-- sold listings from the last 12 months (all of them if none are that recent), dropping the highest and
-- lowest once there are 5 or more.
create or replace function public.car_values(p_owner uuid) returns table (car_id uuid, value numeric)
language sql stable security definer set search_path = public as $$
  select c.id, round(coalesce(pur.manual_value, est.median)::numeric, 2)
  from cars c
  left join car_purchases pur on pur.car_id = c.id
  left join lateral (
    with k as (select price, sold_on from comps where comps.car_id = c.id),
    r as (select price from k where sold_on is null or sold_on >= current_date - 365),
    u as (select price from r union all select price from k where not exists (select 1 from r)),
    ranked as (select price, row_number() over (order by price) as rn, count(*) over () as n from u)
    select percentile_cont(0.5) within group (order by price) as median
    from ranked where n < 5 or (rn > 1 and rn < n)
  ) est on true
  where c.owner_id = p_owner
    and coalesce(pur.manual_value, est.median) is not null
    and (p_owner = auth.uid() or exists (select 1 from profiles where id = p_owner and is_public and show_values));
$$;
