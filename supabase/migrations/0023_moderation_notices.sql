-- Release 0.28: when the team removes someone's item or photo, they get a notification saying why.
-- And reports remember whose content was reported, so admins can see a collector's recent history
-- even after the content is gone.

-- Notifications from the team have no actor or comment, and carry their own text.
alter table public.notifications alter column actor_id drop not null;
alter table public.notifications alter column comment_id drop not null;
alter table public.notifications add column subject text check (char_length(subject) <= 200);  -- e.g. the item's title
alter table public.notifications add column message text check (char_length(message) <= 1000);
alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('comment_item', 'comment_profile', 'reply', 'removed_item', 'removed_photo'));

-- Whose content each report is about, filled in automatically.
alter table public.reports add column target_owner_id uuid references public.profiles on delete set null;
create index reports_target_owner_idx on public.reports (target_owner_id, created_at desc);

create or replace function public.reports_target_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.target_owner_id := case new.target_type
    when 'item' then (select owner_id from items where id = new.target_id)
    when 'comment' then (select author_id from comments where id = new.target_id)
    when 'profile' then new.target_id
  end;
  return new;
end $$;
create trigger reports_target_owner before insert on public.reports
  for each row execute function public.reports_target_owner();

-- Fill it in for reports already filed (where the content still exists).
update public.reports r set target_owner_id = case r.target_type
    when 'item' then (select owner_id from items where id = r.target_id)
    when 'comment' then (select author_id from comments where id = r.target_id)
    when 'profile' then (select id from profiles where id = r.target_id)
  end
where target_owner_id is null;
