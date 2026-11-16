-- Security basics: every table is locked down, private data stays private, and members can't give
-- themselves memberships or admin rights (0001, 0002, 0029).

-- check: every table has row level security turned on (a new table without it would be open to everyone)
do $$
declare missing text;
begin
  select string_agg(c.relname, ', ') into missing from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  perform t.ok(missing is null, 'tables without row level security: ' || coalesce(missing, ''));
end $$;

-- check: database functions that run with extra rights pin their search path (so they can't be tricked into running someone else's function)
do $$
declare missing text;
begin
  select string_agg(p.proname, ', ') into missing from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef
    and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%');
  perform t.ok(missing is null, 'security definer functions without a search_path: ' || coalesce(missing, ''));
end $$;

-- check: members can't give themselves a membership, admin rights, or change the admin log, error log or snapshots
do $$
declare a uuid := t.new_user('sneaky');
begin
  perform t.act_as(a);
  perform t.fails($q$update memberships set comp_active = true, status = 'active' where user_id = auth.uid()$q$, 'permission denied', 'giving yourself a membership');
  perform t.fails($q$insert into admins (user_id) values (auth.uid())$q$, 'permission denied', 'making yourself an admin');
  perform t.fails($q$delete from admin_log$q$, 'permission denied', 'clearing the admin log');
  perform t.fails($q$update app_errors set status = 'resolved'$q$, 'permission denied', 'changing the error log');
  perform t.fails($q$insert into collection_snapshots (owner_id, items, cost, value, valued_items) values (auth.uid(), 1, 0, 1000000, 1)$q$, 'permission denied', 'faking a value snapshot');
  perform t.as_system();
  perform t.ok(not is_member(a), 'still not a member');
end $$;

-- check: private details (full name, location, price paid, value, sold listings, notifications) can't be read by anyone else
do $$
declare a uuid := t.new_user('private_owner', true); b uuid := t.new_user('nosy'); it uuid;
begin
  perform t.act_as(a);
  update profile_private set full_name = 'Pat Owner', location = 'Springfield' where id = a;
  insert into items (title) values ('Rare card') returning id into it;
  insert into item_purchases (item_id, paid, manual_value) values (it, 100, 500);
  insert into comps (item_id, price) values (it, 450);
  perform t.act_as(b);
  insert into comments (profile_id, item_id, body) values (a, it, 'Lovely card');
  perform t.ok((select count(*) = 0 from profile_private where id = a), 'someone else''s full name and location');
  perform t.ok((select count(*) = 0 from item_purchases where item_id = it), 'someone else''s price paid');
  perform t.ok((select count(*) = 0 from comps where item_id = it), 'someone else''s sold listings');
  perform t.ok((select count(*) = 0 from memberships where user_id = a), 'someone else''s membership');
  perform t.ok((select count(*) = 0 from notifications where user_id = a), 'someone else''s notifications');
  perform t.ok(profile_email(a) is null and profile_location(a) is null, 'email and location stay hidden unless they choose to show them');
  perform t.ok((select count(*) = 0 from item_values(a)), 'values stay hidden unless they choose to show them');
  update item_purchases set paid = 1 where item_id = it; -- matches nothing they're allowed to see
  delete from item_purchases where item_id = it;
  perform t.as_system();
  perform t.ok((select paid = 100 from item_purchases where item_id = it), 'someone else''s price paid is unchanged');
end $$;

-- check: signed-out visitors can't write anything
do $$
declare a uuid := t.new_user('visited'); it uuid;
begin
  perform t.act_as(a);
  insert into items (title) values ('Public item') returning id into it;
  perform t.act_as(null);
  perform t.fails(format($q$insert into comments (profile_id, body, author_id) values (%L, 'hi', %L)$q$, a, a), 'new row violates row-level security', 'commenting while signed out');
  perform t.fails($q$insert into items (title, owner_id) values ('x', gen_random_uuid())$q$, 'new row violates row-level security', 'adding an item while signed out');
  perform t.fails(format($q$insert into reports (target_type, target_id, reason, reporter_id) values ('item', %L, 'spam', %L)$q$, it, a), 'new row violates row-level security', 'reporting while signed out');
  perform t.fails('truncate comments', 'permission denied', 'emptying a table');
end $$;

-- check: photo storage only takes JPEGs of a sensible size
do $$
begin
  perform t.as_system();
  perform t.ok((select bool_and(allowed_mime_types = array['image/jpeg'] and file_size_limit between 1 and 5242880) from storage.buckets where id in ('car-photos', 'avatars'))
    and (select count(*) = 2 from storage.buckets where id in ('car-photos', 'avatars')), 'both photo buckets limited to JPEGs up to 5 MB');
end $$;
