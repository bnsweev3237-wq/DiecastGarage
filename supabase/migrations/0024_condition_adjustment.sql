-- Release 0.29: a condition adjustment, the percent to take off the sold-listing estimate for an item's
-- wear, damage or missing parts. It only applies to the estimate from sold listings, not to a value the
-- collector typed in themselves. Private, and a member feature like the rest of the money fields.
alter table public.item_purchases
  add column condition_adjustment numeric(5, 2) check (condition_adjustment between 0 and 95);

-- Free accounts can't set it (same rule as the other money fields).
create or replace function public.enforce_member_purchase_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_member((select owner_id from items where id = new.item_id)) then return new; end if;
  if tg_op = 'INSERT' then
    new.paid := null; new.shipping := null; new.tax := null; new.fees := null; new.purchased_at := null;
    new.manual_value := null; new.sold_price := null; new.sold_at := null;
    new.include_shipping := false; new.include_tax := false; new.include_fees := false;
    new.condition_adjustment := null;
  else
    new.paid := old.paid; new.shipping := old.shipping; new.tax := old.tax; new.fees := old.fees;
    new.purchased_at := old.purchased_at; new.manual_value := old.manual_value;
    new.sold_price := old.sold_price; new.sold_at := old.sold_at;
    new.include_shipping := old.include_shipping; new.include_tax := old.include_tax; new.include_fees := old.include_fees;
    new.condition_adjustment := old.condition_adjustment;
  end if;
  return new;
end $$;

-- Estimated values use it. Same rule as valueOf() in src/lib/items.ts.
create or replace function public.item_values(p_owner uuid) returns table (item_id uuid, value numeric)
language sql stable security definer set search_path = public as $$
  select i.id, round(coalesce(pur.manual_value, est.median * (1 - coalesce(pur.condition_adjustment, 0) / 100))::numeric, 2)
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
