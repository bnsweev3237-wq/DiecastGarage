-- Release 0.32: collection value over time, wishlist alerts, and invites.

-- ---------- value over time ----------
-- One snapshot per collector per day of what their collection (items they own) cost and is worth.
-- Taken by the daily job; members see a chart. Private to the owner.
create table public.collection_snapshots (
  owner_id uuid not null references public.profiles on delete cascade,
  day date not null default current_date,
  items integer not null,
  cost numeric(14, 2) not null,
  value numeric(14, 2) not null,
  valued_items integer not null,
  primary key (owner_id, day)
);
alter table public.collection_snapshots enable row level security;
create policy "own snapshots" on public.collection_snapshots for select using (owner_id = auth.uid());

-- Same rules as the app: value is your own value, or the sold-listing median minus the condition
-- adjustment; cost is price paid plus whichever extras you chose to include.
create or replace function public.take_collection_snapshots() returns integer
language sql security definer set search_path = public as $$
  with per_item as (
    select i.owner_id,
           i.quantity,
           case when pur.paid is null then null else pur.paid
             + case when pur.include_shipping then coalesce(pur.shipping, 0) else 0 end
             + case when pur.include_tax then coalesce(pur.tax, 0) else 0 end
             + case when pur.include_fees then coalesce(pur.fees, 0) else 0 end end as cost,
           coalesce(pur.manual_value, est.median * (1 - coalesce(pur.condition_adjustment, 0) / 100)) as value
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
    where i.status = 'owned' and is_member(i.owner_id)
  ), ins as (
    insert into collection_snapshots (owner_id, day, items, cost, value, valued_items)
    select owner_id, current_date, count(*), round(coalesce(sum(cost), 0)::numeric, 2),
           round(coalesce(sum(value), 0)::numeric, 2), count(value)
    from per_item group by owner_id
    on conflict (owner_id, day) do update
      set items = excluded.items, cost = excluded.cost, value = excluded.value, valued_items = excluded.valued_items
    returning 1
  )
  select count(*)::integer from ins;
$$;
revoke all on function public.take_collection_snapshots() from public, anon, authenticated;
grant execute on function public.take_collection_snapshots() to service_role;

-- ---------- wishlist alerts ----------
alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('comment_item', 'comment_profile', 'reply', 'removed_item', 'removed_photo', 'follow', 'new_item', 'rating', 'wishlist_match'));

-- When an item goes up for sale, tell collectors with a matching wishlist item: same category, and every
-- meaningful word of the wishlist item's name appears in the item's details. One alert per item each.
create or replace function public.notify_wishlist_matches() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not new.for_sale or new.is_hidden or new.status <> 'owned' or (tg_op = 'UPDATE' and old.for_sale) then return new; end if;
  insert into notifications (user_id, actor_id, kind, item_id, profile_id, subject)
  select distinct on (w.owner_id) w.owner_id, new.owner_id, 'wishlist_match', new.id, new.owner_id, w.title
  from items w
  where w.status = 'wishlist' and w.category = new.category and w.owner_id <> new.owner_id
    and not is_blocked(w.owner_id, new.owner_id) and not is_blocked(new.owner_id, w.owner_id)
    and exists (select 1 from profiles p where p.id = new.owner_id and p.is_public and not p.under_review)
    and not exists (select 1 from notifications n where n.user_id = w.owner_id and n.item_id = new.id and n.kind = 'wishlist_match')
    and (select count(*) from regexp_split_to_table(lower(extensions.unaccent(w.title)), '[^a-z0-9/#]+') t
         where char_length(t) >= 3 and t not in ('the', 'and', 'for', 'with', 'new', 'card', 'cards')) > 0
    and not exists (
      select 1 from regexp_split_to_table(lower(extensions.unaccent(w.title)), '[^a-z0-9/#]+') t
      where char_length(t) >= 3 and t not in ('the', 'and', 'for', 'with', 'new', 'card', 'cards')
        and position(t in new.search_text) = 0)
  order by w.owner_id, w.created_at;
  return new;
end $$;
create trigger items_wishlist_alerts after insert or update of for_sale on public.items
  for each row execute function public.notify_wishlist_matches();

-- ---------- invites ----------
-- Who invited each collector, from the invite link they signed up with.
alter table public.profiles add column referred_by uuid references public.profiles on delete set null;
create index profiles_referred_by_idx on public.profiles (referred_by);

create or replace function public.profiles_set_referrer() returns trigger
language plpgsql security definer set search_path = public as $$
declare ref text;
begin
  select lower(raw_user_meta_data->>'ref') into ref from auth.users where id = new.id;
  if ref is not null and ref <> new.username then
    select id into new.referred_by from profiles where username = ref;
  end if;
  return new;
end $$;
create trigger profiles_set_referrer before insert on public.profiles
  for each row execute function public.profiles_set_referrer();
