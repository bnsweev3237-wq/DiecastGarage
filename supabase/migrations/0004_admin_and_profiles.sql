-- Release 0.4: admin portal, profile pictures, social and eBay profile links.

-- ---------- admins ----------
-- Who can use /admin. No policies: the website reads and writes these only with the service role,
-- so nobody can see who the admins are or what they did. Add an admin by inserting their user id here.
create table public.admins (
  user_id uuid primary key references public.profiles on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create table public.admin_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles on delete set null,
  action text not null,
  target_user uuid references public.profiles on delete set null,
  detail jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_log enable row level security;
create index admin_log_created_idx on public.admin_log (created_at desc);

-- Lets a signed-in person ask only whether they themselves are an admin.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

insert into public.admins (user_id) select id from public.profiles where username = 'bnsweev'
on conflict do nothing;

-- ---------- profile picture and links ----------
alter table public.profiles
  add column avatar_path text check (avatar_path is null or avatar_path like id::text || '/%'),
  add column facebook_url text check (facebook_url ~* '^https://(www\.|m\.)?(facebook\.com|fb\.com)/[^[:space:]]{1,200}$'),
  add column x_url text check (x_url ~* '^https://(www\.)?(x\.com|twitter\.com)/[a-z0-9_]{1,15}/?$'),
  add column instagram_url text check (instagram_url ~* '^https://(www\.)?instagram\.com/[a-z0-9_.]{1,30}/?$'),
  add column ebay_url text check (ebay_url ~* '^https://([a-z0-9-]+\.)*ebay\.(com|us|ca|co\.uk|com\.au|de|fr|it|es|ie|at|ch|nl|be|pl|com\.sg|com\.my|ph|in)/(usr|str)/[^[:space:]/?#]{1,80}/?$');

revoke update on public.profiles from anon, authenticated;
grant update (bio, is_public, show_email, show_values, show_location, comments_from, show_follows,
              avatar_path, facebook_url, x_url, instagram_url, ebay_url)
  on public.profiles to authenticated;

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "replace own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
