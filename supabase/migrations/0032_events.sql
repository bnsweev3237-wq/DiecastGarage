-- Release 0.40: card show and swap meet calendar. Members post upcoming shows, swap meets, conventions,
-- auctions and meetups; others mark "I'm going". Events follow the content rules (the website field is
-- the one place a link belongs), can be reported, and are hidden for review after 5 reports.
-- Keep in sync with src/app/actions.ts (events) and src/lib/events.ts.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references public.profiles on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 120),
  kind text not null default 'show' check (kind in ('show', 'swap', 'convention', 'auction', 'meetup', 'other')),
  starts_on date not null,
  ends_on date not null,
  hours text check (char_length(hours) <= 60),
  venue text check (char_length(venue) <= 120),
  address text check (char_length(address) <= 200),
  city text not null check (char_length(btrim(city)) between 1 and 80),
  region text not null check (char_length(btrim(region)) between 2 and 40), -- state or province
  country text not null default 'US' check (country ~ '^[A-Z]{2}$'),
  categories text[] not null default '{}' check (cardinality(categories) <= 30),
  admission text check (char_length(admission) <= 60),
  website text check (website is null or (char_length(website) <= 300 and website ~* '^https://[^[:space:]]{3,}$')),
  description text check (char_length(description) <= 2000),
  is_cancelled boolean not null default false,
  under_review boolean not null default false,
  going_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on and ends_on <= starts_on + 14)
);
create index events_upcoming_idx on public.events (ends_on, starts_on) where not under_review;
create index events_creator_idx on public.events (created_by, created_at desc);

create table public.event_rsvps (
  event_id uuid not null references public.events on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index event_rsvps_user_idx on public.event_rsvps (user_id);

alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
create policy "events visible" on public.events for select using (not under_review or created_by = auth.uid());
create policy "post events" on public.events for insert to authenticated with check (created_by = auth.uid());
create policy "edit own events" on public.events for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "delete own events" on public.events for delete using (created_by = auth.uid());
create policy "rsvps visible" on public.event_rsvps for select using (true);
create policy "own rsvps" on public.event_rsvps for insert to authenticated with check (user_id = auth.uid());
create policy "remove own rsvps" on public.event_rsvps for delete using (user_id = auth.uid());
-- Members can't change the review flag or the going count themselves.
revoke update on public.events from anon, authenticated;
grant update (title, kind, starts_on, ends_on, hours, venue, address, city, region, country, categories, admission, website, description, is_cancelled)
  on public.events to authenticated;

create or replace function public.check_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.starts_on < current_date - 1 then raise exception 'EVENT_IN_PAST'; end if;
    if auth.uid() is not null and (select count(*) from events where created_by = new.created_by and created_at > now() - interval '1 day') >= 10 then
      raise exception 'RATE_LIMIT_EVENTS';
    end if;
  end if;
  perform public.check_content(
    array['title', 'venue', 'address', 'hours', 'admission', 'description', 'city', 'region'],
    array[new.title, new.venue, new.address, new.hours, new.admission, new.description, new.city, new.region],
    case when tg_op = 'UPDATE' then array[old.title, old.venue, old.address, old.hours, old.admission, old.description, old.city, old.region]
    else array[]::text[] end);
  new.updated_at := now();
  return new;
end $$;
create trigger events_check before insert or update on public.events for each row execute function public.check_event();

-- RSVPs: only for visible, upcoming events; keeps the going count up to date.
create or replace function public.check_rsvp() returns trigger
language plpgsql security definer set search_path = public as $$
declare e record;
begin
  select ends_on, under_review, is_cancelled into e from events where id = new.event_id;
  if e is null or e.under_review or e.is_cancelled or e.ends_on < current_date then raise exception 'RSVP_NOT_ALLOWED'; end if;
  return new;
end $$;
create trigger event_rsvps_check before insert on public.event_rsvps for each row execute function public.check_rsvp();

create or replace function public.refresh_going_count() returns trigger
language plpgsql security definer set search_path = public as $$
declare target uuid := coalesce(new.event_id, old.event_id);
begin
  update events set going_count = (select count(*) from event_rsvps where event_id = target) where id = target;
  return null;
end $$;
create trigger event_rsvps_refresh after insert or delete on public.event_rsvps for each row execute function public.refresh_going_count();

-- Reports can be about events too. Replaces 0016's versions of these two functions.
alter table public.reports drop constraint reports_target_type_check;
alter table public.reports add constraint reports_target_type_check check (target_type in ('item', 'comment', 'profile', 'event'));

create or replace function public.reports_target_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.target_owner_id := case new.target_type
    when 'item' then (select owner_id from items where id = new.target_id)
    when 'comment' then (select author_id from comments where id = new.target_id)
    when 'profile' then new.target_id
    when 'event' then (select created_by from events where id = new.target_id)
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
    end if;
  end if;
  return new;
end $$;

-- Same as 0029: nobody signed in or out needs to empty a whole table.
revoke truncate on public.events, public.event_rsvps from anon, authenticated;
