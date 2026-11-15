-- Release 0.16: find uploaded photos that no item or profile uses, so a daily job can delete them.
-- Photos get orphaned when someone uploads in the item form and leaves without saving.
-- Only files older than p_min_age are listed, so uploads in a form that's still open are safe.
-- The job deletes them through the Storage API (deleting rows here would leave the files behind).
create or replace function public.orphan_photos(p_min_age interval default '1 day', p_limit int default 1000)
returns table (bucket text, name text)
language sql stable security definer set search_path = public, storage as $$
  select o.bucket_id, o.name
  from storage.objects o
  where o.bucket_id in ('car-photos', 'avatars')
    and o.created_at < now() - p_min_age
    and (
      (o.bucket_id = 'car-photos' and not exists (
        select 1 from public.items i where i.photo_path = o.name or o.name = any (i.photos)))
      or
      (o.bucket_id = 'avatars' and not exists (
        select 1 from public.profiles p where p.avatar_path = o.name))
    )
  order by o.created_at
  limit p_limit;
$$;
revoke all on function public.orphan_photos(interval, int) from public, anon, authenticated;
grant execute on function public.orphan_photos(interval, int) to service_role;
