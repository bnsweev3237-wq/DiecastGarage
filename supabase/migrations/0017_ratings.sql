-- Release 0.24: collectors rate each other's items from 1 to 5 stars, and Explore shows the best first.
-- Each item keeps its rating count, average and a ranking score. The score is a weighted average that
-- starts every item at 3 stars as if it had 3 ratings, so one 5-star vote can't jump an item to the top:
--   score = (3 * 3 + sum of stars) / (3 + number of ratings)
-- The owner's own "My rating" (items.rating) stays separate and doesn't count.

create table public.item_ratings (
  item_id uuid not null references public.items on delete cascade,
  rater_id uuid not null default auth.uid() references public.profiles on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (item_id, rater_id)
);
create index item_ratings_rater_idx on public.item_ratings (rater_id, created_at desc);
alter table public.item_ratings enable row level security;
-- You can see and change only your own ratings; everyone sees the totals on the item.
create policy "own ratings" on public.item_ratings for all
  using (rater_id = auth.uid()) with check (rater_id = auth.uid());

alter table public.items
  add column rating_count integer not null default 0,
  add column rating_avg numeric(3, 2),
  add column rating_score numeric(4, 3) not null default 3;
create index items_rating_score_idx on public.items (rating_score desc, created_at desc);

-- Who can rate: signed in, not the owner, the item is visible to them, and the owner hasn't blocked them.
create or replace function public.check_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare it record;
begin
  select owner_id, is_hidden, under_review into it from items where id = new.item_id;
  if it is null or it.is_hidden or it.under_review or not can_view_collection(it.owner_id) then
    raise exception 'RATING_NOT_ALLOWED';
  end if;
  if it.owner_id = new.rater_id then raise exception 'RATING_OWN_ITEM'; end if;
  if is_blocked(it.owner_id, new.rater_id) then raise exception 'BLOCKED'; end if;
  if tg_op = 'INSERT' and (select count(*) from item_ratings
      where rater_id = new.rater_id and created_at > now() - interval '1 day') >= 300 then
    raise exception 'RATE_LIMIT_RATINGS';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger item_ratings_check before insert or update on public.item_ratings
  for each row execute function public.check_rating();

-- Keeps the item's count, average and score up to date.
create or replace function public.refresh_item_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare target uuid := coalesce(new.item_id, old.item_id);
begin
  update items i set
    rating_count = s.n,
    rating_avg = case when s.n > 0 then round(s.total::numeric / s.n, 2) end,
    rating_score = round((9 + s.total)::numeric / (3 + s.n), 3)
  from (select count(*) as n, coalesce(sum(stars), 0) as total from item_ratings where item_id = target) s
  where i.id = target;
  return null;
end $$;
create trigger item_ratings_refresh after insert or update or delete on public.item_ratings
  for each row execute function public.refresh_item_rating();

-- New ratings shouldn't count as the owner editing the item, so "Last modified" stays honest.
create or replace function public.items_touch() returns trigger
language plpgsql as $$
begin
  new.owner_id = old.owner_id; -- an item can't be moved to someone else's collection
  if to_jsonb(new) - array['rating_count', 'rating_avg', 'rating_score', 'updated_at', 'search_text', 'under_review']
     is distinct from to_jsonb(old) - array['rating_count', 'rating_avg', 'rating_score', 'updated_at', 'search_text', 'under_review'] then
    new.updated_at = now();
  end if;
  return new;
end $$;
drop trigger items_touch on public.items;
create trigger items_touch before update on public.items
  for each row execute function public.items_touch();

-- Owners can't edit their own rating totals.
create or replace function public.keep_rating_totals() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.rating_count := old.rating_count; new.rating_avg := old.rating_avg; new.rating_score := old.rating_score;
  end if;
  return new;
end $$;
create trigger items_keep_rating_totals before update on public.items
  for each row execute function public.keep_rating_totals();
