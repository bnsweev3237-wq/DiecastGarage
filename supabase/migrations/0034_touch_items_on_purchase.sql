-- Release 0.42 (continued): editing what you paid (or shipping, your value, condition adjustment, sale
-- price) or logging a sold listing now counts as modifying the item, so it moves to the top of
-- My collection's "Last modified" list. Those details live in item_purchases and comps, not on the item.

create or replace function public.touch_item_from_child() returns trigger
language plpgsql security definer set search_path = public as $$
declare target uuid := coalesce(new.item_id, old.item_id);
begin
  if tg_op = 'UPDATE' and to_jsonb(new) is not distinct from to_jsonb(old) then return null; end if;
  update items set updated_at = now() where id = target;
  return null;
end $$;

create trigger item_purchases_touch_item after insert or update or delete on public.item_purchases
  for each row execute function public.touch_item_from_child();
create trigger comps_touch_item after insert or update or delete on public.comps
  for each row execute function public.touch_item_from_child();
