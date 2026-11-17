-- Release 0.39: open to trades, and trade matches.
--  * Collectors mark items they own as open to trade (free and member accounts alike).
--  * A trade match is someone's open-to-trade item that fits your wishlist, by the same rule as wishlist
--    alerts: same category, and every meaningful word of the wishlist item's name is in the item's details.
--  * You're notified when an item that fits your wishlist goes up for trade (and, as before, for sale).

alter table public.items add column open_to_trade boolean not null default false;
create index items_open_to_trade_idx on public.items (category) where open_to_trade;

-- Only items you own can be open to trade; selling it or moving it to the wishlist clears the flag.
create or replace function public.items_trade_only_owned() returns trigger
language plpgsql as $$
begin
  if new.status <> 'owned' then new.open_to_trade := false; end if;
  return new;
end $$;
create trigger items_trade_only_owned before insert or update on public.items
  for each row execute function public.items_trade_only_owned();

-- The wishlist matching rule, shared by alerts and trade matches. Words under 3 letters and filler words
-- don't count; a wishlist name with no meaningful words matches nothing.
create or replace function public.wish_matches(p_wish_title text, p_wish_category text, p_category text, p_search_text text) returns boolean
language sql stable set search_path = public, extensions as $$
  select p_wish_category = p_category
    and exists (
      select 1 from regexp_split_to_table(lower(extensions.unaccent(p_wish_title)), '[^a-z0-9/#]+') t
      where char_length(t) >= 3 and t not in ('the', 'and', 'for', 'with', 'new', 'card', 'cards'))
    and not exists (
      select 1 from regexp_split_to_table(lower(extensions.unaccent(p_wish_title)), '[^a-z0-9/#]+') t
      where char_length(t) >= 3 and t not in ('the', 'and', 'for', 'with', 'new', 'card', 'cards')
        and position(t in coalesce(p_search_text, '')) = 0);
$$;

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('comment_item', 'comment_profile', 'reply', 'removed_item', 'removed_photo', 'follow', 'new_item', 'rating', 'wishlist_match', 'trade_match'));

-- Replaces 0027's version: also fires when an item goes up for trade. One alert of each kind per item
-- per collector. Separate IFs: OLD is empty on insert.
create or replace function public.notify_wishlist_matches() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  sale_new boolean := new.for_sale;
  trade_new boolean := new.open_to_trade;
  k text;
begin
  if new.is_hidden or new.status <> 'owned' then return new; end if;
  if tg_op = 'UPDATE' then
    if old.for_sale then sale_new := false; end if;
    if old.open_to_trade then trade_new := false; end if;
  end if;
  foreach k in array array['wishlist_match', 'trade_match'] loop
    if (k = 'wishlist_match' and sale_new) or (k = 'trade_match' and trade_new) then
      insert into notifications (user_id, actor_id, kind, item_id, profile_id, subject)
      select distinct on (w.owner_id) w.owner_id, new.owner_id, k, new.id, new.owner_id, w.title
      from items w
      where w.status = 'wishlist' and w.category = new.category and w.owner_id <> new.owner_id
        and wish_matches(w.title, w.category, new.category, new.search_text)
        and not is_blocked(w.owner_id, new.owner_id) and not is_blocked(new.owner_id, w.owner_id)
        and exists (select 1 from profiles p where p.id = new.owner_id and p.is_public and not p.under_review)
        and not exists (select 1 from notifications n where n.user_id = w.owner_id and n.item_id = new.id and n.kind = k)
      order by w.owner_id, w.created_at;
    end if;
  end loop;
  return new;
end $$;
drop trigger items_wishlist_alerts on public.items;
create trigger items_wishlist_alerts after insert or update of for_sale, open_to_trade on public.items
  for each row execute function public.notify_wishlist_matches();

-- Trade matches for the signed-in collector:
--   'theirs': other collectors' open-to-trade items that fit your wishlist
--   'mine':   your open-to-trade items that fit someone else's public wishlist
-- Leaves out hidden items and wishlists, private or reviewed collections, and blocks either way.
create or replace function public.trade_matches() returns table (direction text, item_id uuid, other_id uuid, wish_id uuid, wish_title text)
language sql stable security definer set search_path = public, extensions as $$
  select 'theirs', i.id, i.owner_id, w.id, w.title
  from items w join items i on i.category = w.category
  where w.owner_id = auth.uid() and w.status = 'wishlist'
    and i.open_to_trade and i.status = 'owned' and not i.is_hidden and not i.under_review and i.owner_id <> auth.uid()
    and can_view_collection(i.owner_id)
    and not is_blocked(i.owner_id, auth.uid()) and not is_blocked(auth.uid(), i.owner_id)
    and wish_matches(w.title, w.category, i.category, i.search_text)
  union all
  select 'mine', i.id, w.owner_id, w.id, w.title
  from items i join items w on w.category = i.category
  where i.owner_id = auth.uid() and i.open_to_trade and i.status = 'owned'
    and w.status = 'wishlist' and not w.is_hidden and not w.under_review and w.owner_id <> auth.uid()
    and can_view_collection(w.owner_id)
    and not is_blocked(w.owner_id, auth.uid()) and not is_blocked(auth.uid(), w.owner_id)
    and wish_matches(w.title, w.category, i.category, i.search_text)
  limit 500;
$$;
revoke all on function public.trade_matches() from public, anon;
grant execute on function public.trade_matches() to authenticated;
