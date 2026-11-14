-- Release 0.14: complimentary memberships that admins grant, with or without an end date.
-- Kept apart from the Stripe fields so payment updates never touch a comp.
-- Members can read their own row, so who granted it and why live only in admin_log.
alter table public.memberships
  add column comp_active boolean not null default false,
  add column comp_until date; -- last day of the comp; null means it never expires

-- A member is anyone with a paid subscription or a comp that hasn't ended.
-- Same rule as isMember() in src/lib/limits.ts.
create or replace function public.is_member(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where user_id = uid
      and (status in ('active', 'trialing') or (comp_active and (comp_until is null or comp_until >= current_date)))
  );
$$;
