-- Release 0.30: favorites, and more notifications (new followers, new items from people you follow,
-- and new ratings on your items).

-- ---------- favorites ----------
create table public.favorites (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  item_id uuid not null references public.items on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
create index favorites_item_idx on public.favorites (item_id);
alter table public.favorites enable row level security;
-- Your saved items are private to you.
create policy "own favorites" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- You can save items you can see, but not your own.
create or replace function public.check_favorite() returns trigger
language plpgsql security definer set search_path = public as $$
declare it record;
begin
  select owner_id, is_hidden, under_review into it from items where id = new.item_id;
  if it is null or it.is_hidden or it.under_review or not can_view_collection(it.owner_id) then raise exception 'FAVORITE_NOT_ALLOWED'; end if;
  if it.owner_id = new.user_id then raise exception 'FAVORITE_OWN_ITEM'; end if;
  if (select count(*) from favorites where user_id = new.user_id) >= 2000 then raise exception 'FAVORITE_LIMIT'; end if;
  return new;
end $$;
create trigger favorites_check before insert on public.favorites
  for each row execute function public.check_favorite();

-- ---------- more notification kinds ----------
alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('comment_item', 'comment_profile', 'reply', 'removed_item', 'removed_photo', 'follow', 'new_item', 'rating'));
alter table public.notifications add column stars smallint check (stars between 1 and 5);

-- Someone followed you.
create or replace function public.notify_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_blocked(new.followee_id, new.follower_id) and not exists (
      select 1 from notifications where user_id = new.followee_id and actor_id = new.follower_id
        and kind = 'follow' and created_at > now() - interval '1 day') then
    insert into notifications (user_id, actor_id, kind, profile_id) values (new.followee_id, new.follower_id, 'follow', new.follower_id);
  end if;
  return new;
end $$;
create trigger follows_notify after insert on public.follows
  for each row execute function public.notify_follow();

-- Someone you follow added an item. One notification per collector until you read it, so a big
-- import doesn't flood followers; the newest item is the one it points to.
create or replace function public.notify_new_item() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'owned' or new.is_hidden or not exists (select 1 from profiles where id = new.owner_id and is_public and not under_review) then
    return new;
  end if;
  update notifications set item_id = new.id, created_at = now()
    where kind = 'new_item' and actor_id = new.owner_id and read_at is null
      and user_id in (select follower_id from follows where followee_id = new.owner_id);
  insert into notifications (user_id, actor_id, kind, item_id, profile_id)
    select f.follower_id, new.owner_id, 'new_item', new.id, new.owner_id
    from follows f
    where f.followee_id = new.owner_id
      and not is_blocked(f.follower_id, new.owner_id)
      and not exists (select 1 from notifications n where n.user_id = f.follower_id and n.actor_id = new.owner_id
                      and n.kind = 'new_item' and n.read_at is null);
  return new;
end $$;
create trigger items_notify_followers after insert on public.items
  for each row execute function public.notify_new_item();

-- Someone rated your item (new ratings only, not changes).
create or replace function public.notify_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare it record;
begin
  select owner_id into it from items where id = new.item_id;
  if it is not null and not is_blocked(it.owner_id, new.rater_id) then
    insert into notifications (user_id, actor_id, kind, item_id, profile_id, stars)
    values (it.owner_id, new.rater_id, 'rating', new.item_id, it.owner_id, new.stars);
  end if;
  return new;
end $$;
create trigger item_ratings_notify after insert on public.item_ratings
  for each row execute function public.notify_rating();
