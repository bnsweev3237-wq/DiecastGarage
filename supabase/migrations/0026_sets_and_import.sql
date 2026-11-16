-- Release 0.31: set checklists, and room for spreadsheet imports.

-- Imports can add hundreds of items at once, so allow up to 1,000 new items an hour (was 100).
create or replace function public.limit_items() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if (select count(*) from items where owner_id = new.owner_id and created_at > now() - interval '1 hour') >= 1000 then
    raise exception 'RATE_LIMIT_ITEMS';
  end if;
  return new;
end $$;

-- A set is a checklist a collector is working on, like "1999 Base Set" or "2023 Hot Wheels Mainline".
create table public.sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  category text check (category ~ '^[a-z][a-z_]{1,39}$'),
  description text check (char_length(description) <= 1000),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sets_owner_idx on public.sets (owner_id, created_at desc);

-- Each line of the checklist. "have" is ticked by hand or by linking one of your items.
create table public.set_entries (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.sets on delete cascade,
  position integer not null,
  label text not null check (char_length(btrim(label)) between 1 and 200),
  have boolean not null default false,
  item_id uuid references public.items on delete set null,
  created_at timestamptz not null default now()
);
create index set_entries_set_idx on public.set_entries (set_id, position);

alter table public.sets enable row level security;
alter table public.set_entries enable row level security;
create policy "own sets" on public.sets for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "public sets visible" on public.sets for select using (is_public and can_view_collection(owner_id));
create policy "own set entries" on public.set_entries for all
  using (exists (select 1 from sets s where s.id = set_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from sets s where s.id = set_id and s.owner_id = auth.uid())
              and (item_id is null or exists (select 1 from items i where i.id = item_id and i.owner_id = auth.uid())));
create policy "public set entries visible" on public.set_entries for select
  using (exists (select 1 from sets s where s.id = set_id and s.is_public and can_view_collection(s.owner_id)));

-- Limits: 100 sets per collector, 2,000 lines per set. Linking an item counts as having it.
create or replace function public.check_set() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and (select count(*) from sets where owner_id = new.owner_id) >= 100 then raise exception 'SET_LIMIT'; end if;
  perform public.check_content(array['set name', 'set description'], array[new.name, new.description],
    case when tg_op = 'UPDATE' then array[old.name, old.description] else array[]::text[] end);
  new.updated_at := now();
  return new;
end $$;
create trigger sets_check before insert or update on public.sets for each row execute function public.check_set();

create or replace function public.check_set_entry() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and (select count(*) from set_entries where set_id = new.set_id) >= 2000 then raise exception 'SET_ENTRY_LIMIT'; end if;
  if new.item_id is not null then new.have := true; end if;
  return new;
end $$;
create trigger set_entries_check before insert or update on public.set_entries for each row execute function public.check_set_entry();
