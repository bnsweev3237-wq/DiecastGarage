-- Release 0.8: The Collectors Association. Cars become items in categories, for every hobby.
-- Existing cars move to the "diecast" category, and their scale moves into attributes.

alter table public.cars rename to items;
alter table public.car_purchases rename to item_purchases;
alter table public.item_purchases rename column car_id to item_id;
alter table public.comps rename column car_id to item_id;
alter table public.comments rename column car_id to item_id;

alter index public.cars_owner_idx rename to items_owner_idx;
alter index public.cars_for_sale_idx rename to items_for_sale_idx;
alter index public.comps_car_idx rename to comps_item_idx;
alter index public.comments_car_idx rename to comments_item_idx;
alter trigger cars_touch on public.items rename to items_touch;

-- Keep in sync with CATEGORIES and CONDITIONS in src/lib/categories.ts.
alter table public.items rename column boxed to in_package;
alter table public.items
  add column category text not null default 'other'
    check (category in ('diecast', 'cards', 'coins', 'comics', 'sneakers', 'toys', 'lego', 'funko', 'vinyl', 'games', 'other')),
  add column attributes jsonb not null default '{}'
    check (jsonb_typeof(attributes) = 'object' and pg_column_size(attributes) < 4000),
  add column condition text
    check (condition in ('sealed', 'mint', 'near_mint', 'excellent', 'good', 'fair', 'poor'));

update public.items
set category = 'diecast',
    attributes = case when scale is not null and scale <> '' then jsonb_build_object('scale', scale) else '{}'::jsonb end;
alter table public.items drop column scale;
create index items_category_idx on public.items (category, created_at desc);

-- ---------- functions that named the old tables ----------
drop trigger cars_free_limit on public.items;
drop function public.enforce_car_limit();
-- Free accounts keep up to 5 items; members have no limit. Keep in sync with FREE_ITEM_LIMIT in src/lib/limits.ts.
create or replace function public.enforce_item_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_member(new.owner_id)
     and (select count(*) from items where owner_id = new.owner_id) >= 5 then
    raise exception 'FREE_LIMIT' using
      hint = 'Free accounts can keep up to 5 items. Become a member to add more.';
  end if;
  return new;
end $$;
create trigger items_free_limit before insert on public.items
  for each row execute function public.enforce_item_limit();

drop function public.car_values(uuid);
-- Each item's value, only for the owner or when their public collection shows values.
-- Same rule as estimate() in src/lib/items.ts.
create or replace function public.item_values(p_owner uuid) returns table (item_id uuid, value numeric)
language sql stable security definer set search_path = public as $$
  select i.id, round(coalesce(pur.manual_value, est.median)::numeric, 2)
  from items i
  left join item_purchases pur on pur.item_id = i.id
  left join lateral (
    with k as (select price, sold_on from comps where comps.item_id = i.id),
    r as (select price from k where sold_on is null or sold_on >= current_date - 365),
    u as (select price from r union all select price from k where not exists (select 1 from r)),
    ranked as (select price, row_number() over (order by price) as rn, count(*) over () as n from u)
    select percentile_cont(0.5) within group (order by price) as median
    from ranked where n < 5 or (rn > 1 and rn < n)
  ) est on true
  where i.owner_id = p_owner
    and coalesce(pur.manual_value, est.median) is not null
    and (p_owner = auth.uid()
         or (not i.is_hidden and exists (select 1 from profiles where id = p_owner and is_public and show_values)));
$$;

-- Reports about cars now point at items.
alter table public.reports drop constraint reports_target_type_check;
update public.reports set target_type = 'item' where target_type = 'car';
alter table public.reports add constraint reports_target_type_check check (target_type in ('item', 'comment', 'profile'));
