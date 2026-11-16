-- Release 0.34.1: security hardening.

-- Photos and profile pictures: the app always uploads resized JPEGs, so refuse anything else
-- (web pages, scripts, huge files) even if someone uploads straight to storage.
update storage.buckets set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg'] where id = 'car-photos';
update storage.buckets set file_size_limit = 2097152, allowed_mime_types = array['image/jpeg'] where id = 'avatars';

-- Tables only the server and database change. Row level security already refuses members here
-- (none of these have a policy that lets them write); taking away the permission as well means a
-- policy added by mistake later still can't open them up. The server uses the service role.
revoke insert, update, delete, truncate on public.memberships, public.admins, public.admin_log,
  public.app_errors, public.collection_snapshots from anon, authenticated;

-- Nobody signed in or out ever needs to empty a whole table (row level security doesn't cover that).
revoke truncate on all tables in schema public from anon, authenticated;
