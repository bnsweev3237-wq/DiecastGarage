-- Release 0.42: collection goals. A goal is finishing one of your set checklists, reaching a number of
-- items, or reaching a number of items in one category. Progress is worked out from the collection
-- (src/lib/goals.ts), so nothing here needs updating as items come and go.

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles on delete cascade,
  kind text not null check (kind in ('set', 'items', 'category')),
  target integer check (target between 1 and 100000),
  category text check (category ~ '^[a-z][a-z_]{1,39}$'),
  set_id uuid references public.sets on delete cascade,
  title text check (char_length(btrim(title)) between 1 and 80),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  check ((kind = 'set' and set_id is not null)
      or (kind = 'items' and target is not null)
      or (kind = 'category' and category is not null and target is not null))
);
create index goals_owner_idx on public.goals (owner_id, created_at);

alter table public.goals enable row level security;
create policy "own goals" on public.goals for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and (set_id is null or exists (select 1 from sets s where s.id = set_id and s.owner_id = auth.uid())));
create policy "public goals visible" on public.goals for select using (is_public and can_view_collection(owner_id));

-- Up to 20 goals each; names follow the content rules. Keep in sync with src/app/actions.ts (goals).
create or replace function public.check_goal() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and (select count(*) from goals where owner_id = new.owner_id) >= 20 then raise exception 'GOAL_LIMIT'; end if;
  perform public.check_content(array['goal name'], array[new.title],
    case when tg_op = 'UPDATE' then array[old.title] else array[]::text[] end);
  return new;
end $$;
create trigger goals_check before insert or update on public.goals for each row execute function public.check_goal();

revoke truncate on public.goals from anon, authenticated;
