-- Release 0.5: reporting content, recording agreement to the Terms.

-- ---------- reports ----------
-- Collectors can file reports but can't read any back; admins review them with the service role.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles on delete cascade,
  target_type text not null check (target_type in ('car', 'comment', 'profile')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'harassment', 'hate', 'sexual', 'scam', 'misrepresented', 'copyright', 'private_info', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index reports_open_idx on public.reports (created_at desc) where status = 'open';
-- One open report per person per item, so repeat clicks don't pile up.
create unique index reports_one_open on public.reports (reporter_id, target_type, target_id) where status = 'open';

alter table public.reports enable row level security;
create policy "file reports" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open' and resolved_by is null and resolved_at is null);

-- ---------- agreeing to the Terms ----------
alter table public.profile_private
  add column terms_version text,
  add column terms_accepted_at timestamptz;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username) values (new.id, lower(new.raw_user_meta_data->>'username'));
  insert into profile_private (id, full_name, terms_version, terms_accepted_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name'),
    new.raw_user_meta_data->>'terms_version',
    case when new.raw_user_meta_data->>'terms_version' is not null then now() end
  );
  insert into memberships (user_id) values (new.id);
  return new;
end $$;
