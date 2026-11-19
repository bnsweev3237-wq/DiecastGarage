-- Release 0.43: leaderboards and trade reputation.

-- ---------- leaderboards ----------
-- All three only count public collections that aren't under review, and items that aren't hidden.

-- Items rated best by others over the last N days (at least 2 ratings in that time).
create or replace function public.leaderboard_items(p_days integer default 30, p_limit integer default 12)
returns table (item_id uuid, ratings bigint, avg_stars numeric)
language sql stable security definer set search_path = public as $$
  select r.item_id, count(*), round(avg(r.stars)::numeric, 2)
  from item_ratings r
  join items i on i.id = r.item_id
  join profiles p on p.id = i.owner_id
  where r.updated_at > now() - make_interval(days => least(greatest(p_days, 1), 365))
    and not i.is_hidden and not i.under_review and i.status = 'owned' and p.is_public and not p.under_review
  group by r.item_id
  having count(*) >= 2
  order by (sum(r.stars) + 9)::numeric / (count(*) + 3) desc, count(*) desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- Collectors with the most followers.
create or replace function public.leaderboard_followed(p_limit integer default 12)
returns table (profile_id uuid, followers bigint)
language sql stable security definer set search_path = public as $$
  select f.followee_id, count(*)
  from follows f join profiles p on p.id = f.followee_id
  where p.is_public and not p.under_review
  group by f.followee_id
  order by count(*) desc, min(f.created_at)
  limit least(greatest(p_limit, 1), 50);
$$;

-- Collectors who added the most items to their collection over the last N days.
create or replace function public.leaderboard_growing(p_days integer default 30, p_limit integer default 12)
returns table (profile_id uuid, added bigint)
language sql stable security definer set search_path = public as $$
  select i.owner_id, count(*)
  from items i join profiles p on p.id = i.owner_id
  where i.created_at > now() - make_interval(days => least(greatest(p_days, 1), 365))
    and i.status = 'owned' and not i.is_hidden and not i.under_review and p.is_public and not p.under_review
  group by i.owner_id
  order by count(*) desc, max(i.created_at) desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- ---------- trade reputation ----------
-- One review per collector you've traded with: a thumbs up or down and an optional short note. You
-- can change it later. You can only review someone you've talked with in comments, on either of your
-- pages, because trades are arranged there. Keep in sync with src/app/actions.ts (trade reviews).
create table public.trade_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null default auth.uid() references public.profiles on delete cascade,
  reviewee_id uuid not null references public.profiles on delete cascade,
  positive boolean not null,
  note text check (char_length(note) <= 300),
  under_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reviewer_id, reviewee_id),
  check (reviewer_id <> reviewee_id)
);
create index trade_reviews_reviewee_idx on public.trade_reviews (reviewee_id, created_at desc);

alter table public.trade_reviews enable row level security;
create policy "trade reviews visible" on public.trade_reviews for select
  using (reviewer_id = auth.uid() or (not under_review and can_view_collection(reviewee_id)));
create policy "write trade reviews" on public.trade_reviews for insert to authenticated with check (reviewer_id = auth.uid());
create policy "edit own trade reviews" on public.trade_reviews for update using (reviewer_id = auth.uid()) with check (reviewer_id = auth.uid());
create policy "delete own trade reviews" on public.trade_reviews for delete using (reviewer_id = auth.uid());
revoke update on public.trade_reviews from anon, authenticated;
grant update (positive, note) on public.trade_reviews to authenticated;

create or replace function public.can_review_trader(p_reviewer uuid, p_reviewee uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_reviewer <> p_reviewee
    and not is_blocked(p_reviewee, p_reviewer) and not is_blocked(p_reviewer, p_reviewee)
    and exists (select 1 from comments c
                where (c.author_id = p_reviewer and c.profile_id = p_reviewee)
                   or (c.author_id = p_reviewee and c.profile_id = p_reviewer));
$$;
revoke all on function public.can_review_trader(uuid, uuid) from public, anon;
grant execute on function public.can_review_trader(uuid, uuid) to authenticated;

create or replace function public.check_trade_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not can_review_trader(new.reviewer_id, new.reviewee_id) then raise exception 'REVIEW_NOT_ALLOWED'; end if;
    if auth.uid() is not null and (select count(*) from trade_reviews where reviewer_id = new.reviewer_id and created_at > now() - interval '1 day') >= 20 then
      raise exception 'RATE_LIMIT_REVIEWS';
    end if;
  end if;
  perform public.check_content(array['review'], array[new.note],
    case when tg_op = 'UPDATE' then array[old.note] else array[]::text[] end);
  new.updated_at := now();
  return new;
end $$;
create trigger trade_reviews_check before insert or update on public.trade_reviews
  for each row execute function public.check_trade_review();

-- Tell the collector about a new review (not about edits).
alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('comment_item', 'comment_profile', 'reply', 'removed_item', 'removed_photo', 'follow', 'new_item', 'rating', 'wishlist_match', 'trade_match', 'trade_review'));
create or replace function public.notify_trade_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, actor_id, kind, profile_id, subject)
  values (new.reviewee_id, new.reviewer_id, 'trade_review', new.reviewee_id, case when new.positive then 'positive' else 'negative' end);
  return new;
end $$;
create trigger trade_reviews_notify after insert on public.trade_reviews for each row execute function public.notify_trade_review();

-- Reviews can be reported like everything else. Replaces 0032's versions.
alter table public.reports drop constraint reports_target_type_check;
alter table public.reports add constraint reports_target_type_check check (target_type in ('item', 'comment', 'profile', 'event', 'review'));

create or replace function public.reports_target_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.target_owner_id := case new.target_type
    when 'item' then (select owner_id from items where id = new.target_id)
    when 'comment' then (select author_id from comments where id = new.target_id)
    when 'profile' then new.target_id
    when 'event' then (select created_by from events where id = new.target_id)
    when 'review' then (select reviewer_id from trade_reviews where id = new.target_id)
  end;
  return new;
end $$;

create or replace function public.reports_auto_hide() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(distinct reporter_id) from reports
      where target_type = new.target_type and target_id = new.target_id and status = 'open') >= 5 then
    if new.target_type = 'item' then update items set under_review = true where id = new.target_id;
    elsif new.target_type = 'comment' then update comments set under_review = true where id = new.target_id;
    elsif new.target_type = 'profile' then update profiles set under_review = true where id = new.target_id;
    elsif new.target_type = 'event' then update events set under_review = true where id = new.target_id;
    elsif new.target_type = 'review' then update trade_reviews set under_review = true where id = new.target_id;
    end if;
  end if;
  return new;
end $$;

revoke truncate on public.trade_reviews from anon, authenticated;
