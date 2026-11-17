-- Release 0.38: shelves. A shelf is a display case a collector arranges on their page, like
-- "Earnhardt shelf" or "PSA 10s". Unlike a set checklist, it only holds items they already have.

create table public.shelves (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  description text check (char_length(description) <= 500),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shelves_owner_idx on public.shelves (owner_id, created_at);

create table public.shelf_items (
  shelf_id uuid not null references public.shelves on delete cascade,
  item_id uuid not null references public.items on delete cascade,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (shelf_id, item_id)
);
create index shelf_items_item_idx on public.shelf_items (item_id);

alter table public.shelves enable row level security;
alter table public.shelf_items enable row level security;
create policy "own shelves" on public.shelves for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "public shelves visible" on public.shelves for select using (is_public and can_view_collection(owner_id));
-- Only your own items go on your own shelves.
create policy "own shelf items" on public.shelf_items for all
  using (exists (select 1 from shelves s where s.id = shelf_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from shelves s where s.id = shelf_id and s.owner_id = auth.uid())
              and exists (select 1 from items i where i.id = item_id and i.owner_id = auth.uid()));
-- Others see what's on a public shelf, except items that are hidden or under review.
create policy "public shelf items visible" on public.shelf_items for select
  using (exists (select 1 from shelves s where s.id = shelf_id and s.is_public and can_view_collection(s.owner_id))
         and exists (select 1 from items i where i.id = item_id and not i.is_hidden and not i.under_review));

-- Limits: 50 shelves per collector, 200 items per shelf. Names follow the content rules.
-- Keep in sync with the messages in src/app/actions.ts (shelves).
create or replace function public.check_shelf() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and (select count(*) from shelves where owner_id = new.owner_id) >= 50 then raise exception 'SHELF_LIMIT'; end if;
  perform public.check_content(array['shelf name', 'shelf description'], array[new.name, new.description],
    case when tg_op = 'UPDATE' then array[old.name, old.description] else array[]::text[] end);
  new.updated_at := now();
  return new;
end $$;
create trigger shelves_check before insert or update on public.shelves for each row execute function public.check_shelf();

create or replace function public.check_shelf_item() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from shelf_items where shelf_id = new.shelf_id) >= 200 then raise exception 'SHELF_ITEM_LIMIT'; end if;
  update shelves set updated_at = now() where id = new.shelf_id;
  return new;
end $$;
create trigger shelf_items_check before insert on public.shelf_items for each row execute function public.check_shelf_item();

-- Same as 0029: nobody signed in or out needs to empty a whole table.
revoke truncate on public.shelves, public.shelf_items from anon, authenticated;
