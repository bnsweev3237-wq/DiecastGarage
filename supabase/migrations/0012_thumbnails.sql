-- Release 0.18: every item photo gets a small copy, "<name>-t.jpg", for cards and lists.

-- A small copy counts as in use whenever its full photo is.
create or replace function public.orphan_photos(p_min_age interval default '1 day', p_limit int default 1000)
returns table (bucket text, name text)
language sql stable security definer set search_path = public, storage as $$
  select o.bucket_id, o.name
  from storage.objects o
  where o.bucket_id in ('car-photos', 'avatars')
    and o.created_at < now() - p_min_age
    and (
      (o.bucket_id = 'car-photos' and not exists (
        select 1 from public.items i
        where i.photo_path in (o.name, regexp_replace(o.name, '-t\.jpg$', '.jpg'))
           or o.name = any (i.photos)
           or regexp_replace(o.name, '-t\.jpg$', '.jpg') = any (i.photos)))
      or
      (o.bucket_id = 'avatars' and not exists (
        select 1 from public.profiles p where p.avatar_path = o.name))
    )
  order by o.created_at
  limit p_limit;
$$;

-- Item photos that don't have their small copy yet, so the daily job can make them.
create or replace function public.photos_missing_thumbs(p_limit int default 100)
returns table (name text)
language sql stable security definer set search_path = public, storage as $$
  with used as (
    select photo_path as name from public.items where photo_path is not null
    union
    select unnest(photos) from public.items
  )
  select u.name from used u
  where exists (select 1 from storage.objects o where o.bucket_id = 'car-photos' and o.name = u.name)
    and not exists (select 1 from storage.objects o where o.bucket_id = 'car-photos'
                    and o.name = regexp_replace(u.name, '(\.[a-z0-9]+)?$', '-t.jpg', 'i'))
  limit p_limit;
$$;
revoke all on function public.photos_missing_thumbs(int) from public, anon, authenticated;
grant execute on function public.photos_missing_thumbs(int) to service_role;
