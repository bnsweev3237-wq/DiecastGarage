-- Release 0.26: beta testers and their feedback.
-- Admins mark collectors as beta testers (profiles can't change this themselves; it isn't in their
-- update grant). Beta testers get a Send feedback button; feedback is private to admins.
alter table public.profiles add column is_beta_tester boolean not null default false;

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  kind text not null check (kind in ('bug', 'idea', 'other')),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  page text check (char_length(page) <= 300),
  device text check (char_length(device) <= 300),
  status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz not null default now()
);
create index feedback_open_idx on public.feedback (created_at desc) where status = 'open';
alter table public.feedback enable row level security;

-- Only beta testers can send feedback, and they can see what they've sent. Admins use the service role.
create policy "beta testers send feedback" on public.feedback for insert
  with check (author_id = auth.uid() and status = 'open'
              and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_beta_tester));
create policy "see own feedback" on public.feedback for select using (author_id = auth.uid());

-- 30 messages a day is plenty for real testing.
create or replace function public.limit_feedback() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and (select count(*) from feedback
      where author_id = new.author_id and created_at > now() - interval '1 day') >= 30 then
    raise exception 'RATE_LIMIT_FEEDBACK';
  end if;
  return new;
end $$;
create trigger feedback_limits before insert on public.feedback
  for each row execute function public.limit_feedback();

-- Belt and braces: even if profile edit permissions change later, members can't make themselves
-- beta testers or clear a review. Admin tools (service role) can.
create or replace function public.keep_admin_profile_flags() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.is_beta_tester := old.is_beta_tester;
    new.under_review := old.under_review;
  end if;
  return new;
end $$;
create trigger profiles_keep_admin_flags before update on public.profiles
  for each row execute function public.keep_admin_profile_flags();
