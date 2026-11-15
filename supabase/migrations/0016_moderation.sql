-- Release 0.23 (continued): more safeguards.
--  1. Profanity and slurs are blocked in public text, alongside links, phones, emails and payment apps.
--  2. Rate limits on comments, new items, follows and reports.
--  3. The same longer comment can't be pasted across the site (3rd copy in a day is blocked).
--  4. Collectors can block someone: no comments or follows from them, and their comments are hidden from you.
--  5. Anything reported by 5 different people is hidden until an admin reviews it.
-- Same word list as src/lib/content-rules.ts.

-- ---------- 1. language ----------
create or replace function public.content_problem(t text) returns text
language sql immutable as $$
  select case
    when t is null or t = '' then null
    when t ~* '([a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}|\m[a-z0-9._%+-]+\s*(\(at\)|\[at\])\s*[a-z0-9-]+)'
      then 'email'
    when t ~* '(https?://|www\.|\m[a-z0-9-]+(\.[a-z0-9-]+)*\s?(\.|\[\.\]|\(\.\))\s?(com|net|org|io|co|us|info|biz|shop|store|me|ly|gg|tv|app|xyz|ca|uk|de|au|site|online|link|club|live|page|to|cc)\M|\m[a-z0-9-]+\s+dot\s+(com|net|org)\M)'
      then 'link'
    when t ~ '(^|[^0-9])(\+?1[\s.-]?)?\(?[2-9][0-9]{2}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}([^0-9]|$)'
      then 'phone'
    when t ~* '(\m(venmo|zelle|paypal|cash\s?app|apple\s?pay|google\s?pay|chime)\M|(^|\s)\$[a-z][a-z0-9_]{2,})'
      then 'payment'
    when t ~* '(^|[^a-z])(f[u*@]+c?k+(s|ed|er|ers|ing|in|face|head|wit)?|motherf[u*@]+c?k[a-z]*|sh[i!1*]+t(s|ty|head|heads|bag|show)?|bullsh[i!1*]+t|c[u*]nts?|b[i!1*]tch(es|y)?|assholes?|dickheads?|wh[o0]res?|sluts?|twats?|wankers?|n[i!1*]gg(er|a|ers|as|uh)s?|f[a@]gg?(ot|ots|s)?|retard(s|ed)?|kikes?|spics?|wetbacks?|trann(y|ies)|gooks?|ragheads?)([^a-z]|$)'
      then 'language'
  end;
$$;

-- ---------- 2 & 3. rate limits and duplicate comments ----------
-- Admin tools use the service role (no auth.uid()) and skip these.
create or replace function public.limit_comments() returns trigger
language plpgsql security definer set search_path = public as $$
declare norm text := lower(regexp_replace(btrim(new.body), '\s+', ' ', 'g'));
begin
  if auth.uid() is null then return new; end if;
  if (select count(*) from comments where author_id = new.author_id and created_at > now() - interval '1 minute') >= 10
     or (select count(*) from comments where author_id = new.author_id and created_at > now() - interval '1 day') >= 200 then
    raise exception 'RATE_LIMIT_COMMENTS';
  end if;
  if char_length(norm) >= 15 and (select count(*) from comments
      where author_id = new.author_id and created_at > now() - interval '1 day'
        and lower(regexp_replace(btrim(body), '\s+', ' ', 'g')) = norm) >= 2 then
    raise exception 'DUPLICATE_COMMENT';
  end if;
  return new;
end $$;
create trigger comments_limits before insert on public.comments
  for each row execute function public.limit_comments();

create or replace function public.limit_items() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if (select count(*) from items where owner_id = new.owner_id and created_at > now() - interval '1 hour') >= 100 then
    raise exception 'RATE_LIMIT_ITEMS';
  end if;
  return new;
end $$;
create trigger items_limits before insert on public.items
  for each row execute function public.limit_items();

create or replace function public.limit_follows_and_reports() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  -- Separate IFs: PL/pgSQL doesn't stop early, and each table has different columns.
  if tg_table_name = 'follows' then
    if (select count(*) from follows where follower_id = new.follower_id and created_at > now() - interval '1 hour') >= 60 then
      raise exception 'RATE_LIMIT_FOLLOWS';
    end if;
  else
    if (select count(*) from reports where reporter_id = new.reporter_id and created_at > now() - interval '1 day') >= 20 then
      raise exception 'RATE_LIMIT_REPORTS';
    end if;
  end if;
  return new;
end $$;
create trigger follows_limits before insert on public.follows
  for each row execute function public.limit_follows_and_reports();
create trigger reports_limits before insert on public.reports
  for each row execute function public.limit_follows_and_reports();

-- ---------- 4. blocking ----------
create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles on delete cascade,
  blocked_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
-- Only the person who blocked can see or change it. The blocked person is never told.
create policy "own blocks" on public.blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create or replace function public.is_blocked(p_blocker uuid, p_blocked uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks where blocker_id = p_blocker and blocked_id = p_blocked);
$$;

-- Blocking ends follows both ways.
create or replace function public.blocks_unfollow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from follows where (follower_id = new.blocker_id and followee_id = new.blocked_id)
                         or (follower_id = new.blocked_id and followee_id = new.blocker_id);
  return new;
end $$;
create trigger blocks_unfollow after insert on public.blocks
  for each row execute function public.blocks_unfollow();

-- A blocked person can't comment on the blocker's pages or follow them, and vice versa for follows.
create or replace function public.enforce_blocks() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'comments' then
    if is_blocked(new.profile_id, new.author_id) then raise exception 'BLOCKED'; end if;
  else
    if is_blocked(new.followee_id, new.follower_id) or is_blocked(new.follower_id, new.followee_id) then
      raise exception 'BLOCKED';
    end if;
  end if;
  return new;
end $$;
create trigger comments_blocks before insert on public.comments
  for each row execute function public.enforce_blocks();
create trigger follows_blocks before insert on public.follows
  for each row execute function public.enforce_blocks();

-- ---------- 5. hide anything 5 different people report ----------
alter table public.items add column under_review boolean not null default false;
alter table public.comments add column under_review boolean not null default false;
alter table public.profiles add column under_review boolean not null default false;

create or replace function public.reports_auto_hide() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(distinct reporter_id) from reports
      where target_type = new.target_type and target_id = new.target_id and status = 'open') >= 5 then
    if new.target_type = 'item' then update items set under_review = true where id = new.target_id;
    elsif new.target_type = 'comment' then update comments set under_review = true where id = new.target_id;
    elsif new.target_type = 'profile' then update profiles set under_review = true where id = new.target_id;
    end if;
  end if;
  return new;
end $$;
create trigger reports_auto_hide after insert on public.reports
  for each row execute function public.reports_auto_hide();

-- Members' own edits can't set or clear under_review. Only the report count (a security definer
-- function, so it runs as the owner role) and admins (the service role) change it.
create or replace function public.keep_under_review() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then new.under_review := old.under_review; end if;
  return new;
end $$;
create trigger items_keep_review before update on public.items
  for each row execute function public.keep_under_review();
create trigger comments_keep_review before update on public.comments
  for each row execute function public.keep_under_review();

-- Others can't see a profile's collection, items or comments while they're under review.
-- Owners still see their own, with a notice.
create or replace function public.can_view_collection(owner uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select owner = auth.uid() or exists (select 1 from profiles where id = owner and is_public and not under_review);
$$;

drop policy "cars visible with collection" on public.items;
create policy "items visible with collection" on public.items for select
  using ((owner_id = auth.uid()) or ((not is_hidden) and (not under_review) and can_view_collection(owner_id)));

drop policy "comments visible with collection" on public.comments;
create policy "comments visible with collection" on public.comments for select
  using (
    (author_id = auth.uid() or not under_review)
    and not is_blocked(auth.uid(), author_id)
    and can_view_collection(profile_id)
    and ((item_id is null) or exists (select 1 from items c where c.id = comments.item_id))
  );
