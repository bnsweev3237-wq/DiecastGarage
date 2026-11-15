-- Release 0.21: the free plan keeps up to 25 items with one photo each, and no money features.
-- Members get unlimited items, up to 8 photos, for-sale listings, and purchase prices, values,
-- gain or loss and sales. Same rules as src/lib/limits.ts. A lapsed member keeps everything already
-- saved; they just can't add more of it.

-- 25 free items.
create or replace function public.enforce_item_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_member(new.owner_id)
     and (select count(*) from items where owner_id = new.owner_id) >= 25 then
    raise exception 'FREE_LIMIT' using
      hint = 'Free accounts can keep up to 25 items. Become a member to add more.';
  end if;
  return new;
end $$;

-- Listing for sale and extra photos are for members.
create or replace function public.enforce_member_item_features() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  had int := 0; -- extra photos the item already had
begin
  if is_member(new.owner_id) then return new; end if;
  if tg_op = 'UPDATE' then had := cardinality(old.photos); end if;
  if new.for_sale and (tg_op = 'INSERT' or not old.for_sale) then
    raise exception 'MEMBERS_ONLY_SALE';
  end if;
  if cardinality(new.photos) > had then
    raise exception 'MEMBERS_ONLY_PHOTOS';
  end if;
  return new;
end $$;
create trigger items_member_features before insert or update on public.items
  for each row execute function public.enforce_member_item_features();

-- Purchase prices, values and sales are for members. Free accounts can still save where they got
-- an item and where it's stored; money fields keep whatever they held before.
create or replace function public.enforce_member_purchase_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_member((select owner_id from items where id = new.item_id)) then return new; end if;
  if tg_op = 'INSERT' then
    new.paid := null; new.shipping := null; new.tax := null; new.fees := null; new.purchased_at := null;
    new.manual_value := null; new.sold_price := null; new.sold_at := null;
    new.include_shipping := false; new.include_tax := false; new.include_fees := false;
  else
    new.paid := old.paid; new.shipping := old.shipping; new.tax := old.tax; new.fees := old.fees;
    new.purchased_at := old.purchased_at; new.manual_value := old.manual_value;
    new.sold_price := old.sold_price; new.sold_at := old.sold_at;
    new.include_shipping := old.include_shipping; new.include_tax := old.include_tax; new.include_fees := old.include_fees;
  end if;
  return new;
end $$;
create trigger item_purchases_member_fields before insert or update on public.item_purchases
  for each row execute function public.enforce_member_purchase_fields();

-- Logging sold listings to estimate value is for members.
create or replace function public.enforce_member_comps() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_member((select owner_id from items where id = new.item_id)) then
    raise exception 'MEMBERS_ONLY_VALUES';
  end if;
  return new;
end $$;
create trigger comps_members_only before insert on public.comps
  for each row execute function public.enforce_member_comps();

-- Estimated values are a member feature, so only members' items get them.
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
    and is_member(p_owner)
    and coalesce(pur.manual_value, est.median) is not null
    and (p_owner = auth.uid()
         or (not i.is_hidden and exists (select 1 from profiles where id = p_owner and is_public and show_values)));
$$;
