-- Release 0.3: hide single cars, choose who can comment, optional location, private follow lists.

-- ---------- hide one car ----------
-- A hidden car is visible only to its owner, even in a public collection. It also drops off the
-- For sale page, Explore, feeds and value totals, and its comments are hidden with it.
alter table public.cars add column is_hidden boolean not null default false;

drop policy "cars visible with collection" on public.cars;
create policy "cars visible with collection" on public.cars for select
  using (owner_id = auth.uid() or (not is_hidden and public.can_view_collection(owner_id)));

create or replace function public.car_values(p_owner uuid) returns table (car_id uuid, value numeric)
language sql stable security definer set search_path = public as $$
  select c.id, round(coalesce(pur.manual_value, est.median)::numeric, 2)
  from cars c
  left join car_purchases pur on pur.car_id = c.id
  left join lateral (
    with k as (select price, sold_on from comps where comps.car_id = c.id),
    r as (select price from k where sold_on is null or sold_on >= current_date - 365),
    u as (select price from r union all select price from k where not exists (select 1 from r)),
    ranked as (select price, row_number() over (order by price) as rn, count(*) over () as n from u)
    select percentile_cont(0.5) within group (order by price) as median
    from ranked where n < 5 or (rn > 1 and rn < n)
  ) est on true
  where c.owner_id = p_owner
    and coalesce(pur.manual_value, est.median) is not null
    and (p_owner = auth.uid()
         or (not c.is_hidden and exists (select 1 from profiles where id = p_owner and is_public and show_values)));
$$;

-- ---------- who can comment ----------
-- everyone: any signed-in collector. following: only people this collector follows. nobody: comments off.
-- The collector can always comment on their own collection.
alter table public.profiles
  add column comments_from text not null default 'everyone' check (comments_from in ('everyone', 'following', 'nobody')),
  add column show_location boolean not null default false;

create or replace function public.can_comment(p_profile uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    p_profile = auth.uid() or exists (
      select 1 from profiles p where p.id = p_profile and p.is_public and (
        p.comments_from = 'everyone'
        or (p.comments_from = 'following'
            and exists (select 1 from follows f where f.follower_id = p_profile and f.followee_id = auth.uid()))
      )
    )
  );
$$;

-- The exists() checks on cars run under the viewer's own access, so hidden cars' comments stay hidden.
drop policy "comments visible with collection" on public.comments;
create policy "comments visible with collection" on public.comments for select
  using (public.can_view_collection(profile_id)
         and (car_id is null or exists (select 1 from public.cars c where c.id = car_id)));

drop policy "comment on visible collections" on public.comments;
create policy "comment on visible collections" on public.comments for insert
  with check (
    author_id = auth.uid()
    and public.can_comment(profile_id)
    and (car_id is null or exists (select 1 from public.cars c where c.id = car_id and c.owner_id = profile_id))
  );

-- ---------- location ----------
alter table public.profile_private add column location text check (char_length(location) <= 60);

-- A collector's location, only for themselves or when their public collection shows it.
create or replace function public.profile_location(p_profile uuid) returns text
language sql stable security definer set search_path = public as $$
  select pp.location from profile_private pp join profiles p on p.id = pp.id
  where pp.id = p_profile and (p_profile = auth.uid() or (p.is_public and p.show_location));
$$;

-- ---------- follower and following lists ----------
-- A follow shows up in lists only when both collectors show their follow lists. The two people in it
-- always see it, and the counts stay accurate for everyone through follow_counts().
alter table public.profiles add column show_follows boolean not null default true;

drop policy "follows readable" on public.follows;
create policy "follows readable" on public.follows for select
  using (
    follower_id = auth.uid() or followee_id = auth.uid()
    or (exists (select 1 from public.profiles p where p.id = followee_id and p.show_follows)
        and exists (select 1 from public.profiles p where p.id = follower_id and p.show_follows))
  );

create or replace function public.follow_counts(p_profile uuid) returns table (followers bigint, following bigint)
language sql stable security definer set search_path = public as $$
  select (select count(*) from follows where followee_id = p_profile),
         (select count(*) from follows where follower_id = p_profile);
$$;

revoke update on public.profiles from anon, authenticated;
grant update (bio, is_public, show_email, show_values, show_location, comments_from, show_follows)
  on public.profiles to authenticated;
