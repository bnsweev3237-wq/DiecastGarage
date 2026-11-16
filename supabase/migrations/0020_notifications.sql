-- Release 0.26 (continued): replies and notifications.
--  * A comment can reply to another comment on the same page (one level deep).
--  * Collectors are notified when someone comments on their page or items, or replies to their comment.
--  * Each collector chooses whether those notifications are also emailed (private setting).

alter table public.comments add column parent_id uuid references public.comments on delete cascade;
create index comments_parent_idx on public.comments (parent_id, created_at);

-- A reply must be on the same page as the comment it answers, and replies don't nest further.
create or replace function public.check_reply() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if new.parent_id is null then return new; end if;
  select profile_id, item_id, parent_id into p from comments where id = new.parent_id;
  if p is null or p.profile_id <> new.profile_id or p.item_id is distinct from new.item_id then
    raise exception 'REPLY_WRONG_PAGE';
  end if;
  if p.parent_id is not null then new.parent_id := p.parent_id; end if; -- replying to a reply joins the same thread
  return new;
end $$;
create trigger comments_check_reply before insert on public.comments
  for each row execute function public.check_reply();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,  -- who is notified
  actor_id uuid not null references public.profiles on delete cascade, -- who did it
  kind text not null check (kind in ('comment_item', 'comment_profile', 'reply')),
  comment_id uuid not null references public.comments on delete cascade,
  item_id uuid references public.items on delete cascade,
  profile_id uuid not null references public.profiles on delete cascade, -- whose page it's on
  read_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;
alter table public.notifications enable row level security;
-- You see and clear only your own. Notifications are created by the database, never by members.
create policy "own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "read own notifications" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own notifications" on public.notifications for delete using (user_id = auth.uid());
revoke update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

create or replace function public.notify_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare parent_author uuid;
begin
  if new.parent_id is not null then
    select author_id into parent_author from comments where id = new.parent_id;
    if parent_author is not null and parent_author <> new.author_id and not is_blocked(parent_author, new.author_id) then
      insert into notifications (user_id, actor_id, kind, comment_id, item_id, profile_id)
      values (parent_author, new.author_id, 'reply', new.id, new.item_id, new.profile_id);
    end if;
  end if;
  -- The page owner hears about every comment on their page, unless they wrote it or were just notified of the reply.
  if new.profile_id <> new.author_id and new.profile_id is distinct from parent_author then
    insert into notifications (user_id, actor_id, kind, comment_id, item_id, profile_id)
    values (new.profile_id, new.author_id, case when new.item_id is null then 'comment_profile' else 'comment_item' end,
            new.id, new.item_id, new.profile_id);
  end if;
  return new;
end $$;
create trigger comments_notify after insert on public.comments
  for each row execute function public.notify_comment();

-- Email me about notifications (private). On by default; emails only go out once a sender is set up.
alter table public.profile_private add column email_notifications boolean not null default true;
