-- Release 0.34: an error log. Page crashes, browser errors, failed database requests and the daily
-- site check all land here, grouped so the same error counts up instead of repeating. Admins see
-- them under Admin → Errors. Only the server (service role) can read or write it.
create table public.app_errors (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null,                -- source + message + where, used to group repeats
  source text not null check (source in ('server', 'browser', 'query', 'daily_check', 'job')),
  message text not null check (char_length(message) <= 500),
  detail text check (char_length(detail) <= 4000),
  path text check (char_length(path) <= 300),
  user_id uuid references public.profiles on delete set null,
  count integer not null default 1,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  status text not null default 'open' check (status in ('open', 'resolved')),
  alerted_at timestamptz
);
create unique index app_errors_open_fingerprint on public.app_errors (fingerprint) where status = 'open';
create index app_errors_last_seen_idx on public.app_errors (last_seen desc);
alter table public.app_errors enable row level security; -- no policies: members can't see or write it

-- Adds one occurrence, grouping with an open error that has the same fingerprint.
-- Returns true when it's a new error, so the caller knows to send an alert.
create or replace function public.log_app_error(p_fingerprint text, p_source text, p_message text, p_detail text, p_path text, p_user uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare existing uuid;
begin
  update app_errors set count = count + 1, last_seen = now(),
    detail = coalesce(left(p_detail, 4000), detail), path = coalesce(left(p_path, 300), path), user_id = coalesce(p_user, user_id)
  where fingerprint = p_fingerprint and status = 'open' returning id into existing;
  if existing is not null then return false; end if;
  insert into app_errors (fingerprint, source, message, detail, path, user_id)
  values (p_fingerprint, p_source, left(p_message, 500), left(p_detail, 4000), left(p_path, 300), p_user);
  return true;
end $$;
revoke all on function public.log_app_error(text, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.log_app_error(text, text, text, text, text, uuid) to service_role;
