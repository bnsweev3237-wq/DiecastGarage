-- Release 0.44: two-step sign-in (an authenticator app code after the password).
-- Collectors turn it on in Settings. For anyone who has, a session that has only checked the password
-- ("aal1") can't read or change anything until the code is entered ("aal2"), even by calling the
-- database directly. Collectors without it are unaffected. The app sends aal1 sessions to /two-step
-- (src/middleware.ts). New tables must get the same policy: tests/db/security.test.sql checks.

-- True when this session may act: the code was entered, or the collector hasn't turned two-step on.
create or replace function public.mfa_ok() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified');
$$;
revoke all on function public.mfa_ok() from public;
grant execute on function public.mfa_ok() to anon, authenticated;

-- A restrictive policy narrows every other policy on the table, for signed-in sessions only.
do $$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity loop
    execute format('create policy "two-step sign-in" on public.%I as restrictive for all to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()))', t.relname);
  end loop;
end $$;

-- Photos and profile pictures too.
create policy "two-step sign-in" on storage.objects as restrictive for all to authenticated
  using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
