-- Release 0.27: up and down votes on comments, like Reddit.
-- One vote per collector per comment (+1 or -1). Comments keep a running score and counts, and
-- the best-voted conversations show first. You can't vote on your own comments, and someone the
-- author has blocked can't vote on theirs.

create table public.comment_votes (
  comment_id uuid not null references public.comments on delete cascade,
  voter_id uuid not null default auth.uid() references public.profiles on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (comment_id, voter_id)
);
create index comment_votes_voter_idx on public.comment_votes (voter_id, created_at desc);
alter table public.comment_votes enable row level security;
create policy "own votes" on public.comment_votes for all using (voter_id = auth.uid()) with check (voter_id = auth.uid());

alter table public.comments
  add column score integer not null default 0,
  add column upvotes integer not null default 0,
  add column downvotes integer not null default 0;

create or replace function public.check_comment_vote() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select author_id, profile_id, under_review into c from comments where id = new.comment_id;
  if c is null or c.under_review or not can_view_collection(c.profile_id) then raise exception 'VOTE_NOT_ALLOWED'; end if;
  if c.author_id = new.voter_id then raise exception 'VOTE_OWN_COMMENT'; end if;
  if is_blocked(c.author_id, new.voter_id) then raise exception 'BLOCKED'; end if;
  if tg_op = 'INSERT' and (select count(*) from comment_votes
      where voter_id = new.voter_id and created_at > now() - interval '1 hour') >= 300 then
    raise exception 'RATE_LIMIT_VOTES';
  end if;
  return new;
end $$;
create trigger comment_votes_check before insert or update on public.comment_votes
  for each row execute function public.check_comment_vote();

create or replace function public.refresh_comment_score() returns trigger
language plpgsql security definer set search_path = public as $$
declare target uuid := coalesce(new.comment_id, old.comment_id);
begin
  update comments c set
    upvotes = s.up, downvotes = s.down, score = s.up - s.down
  from (select count(*) filter (where value = 1) as up, count(*) filter (where value = -1) as down
        from comment_votes where comment_id = target) s
  where c.id = target;
  return null;
end $$;
create trigger comment_votes_refresh after insert or update or delete on public.comment_votes
  for each row execute function public.refresh_comment_score();
-- Comments have no update permission for members, so nobody can edit their own score.
