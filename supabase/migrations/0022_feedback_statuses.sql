-- Release 0.27: more feedback statuses for admins: New (open), In review, Done and Dismissed.
alter table public.feedback drop constraint feedback_status_check;
alter table public.feedback add constraint feedback_status_check check (status in ('open', 'in_review', 'done', 'dismissed'));
alter table public.feedback add column status_changed_at timestamptz;
create index feedback_status_idx on public.feedback (status, created_at desc);
