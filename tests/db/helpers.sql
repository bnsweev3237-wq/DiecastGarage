-- Helpers for the database tests. Loaded inside each test file's transaction, so they vanish afterwards.
--   t.new_user('name', member, 'invite_ref')  signs someone up (as Supabase would) and returns their id
--   t.act_as(id)       run the next statements as that signed-in collector (null = signed out)
--   t.as_system()      back to the database owner, like the service role or an admin action
--   t.ok(condition, 'what should be true')
--   t.fails('sql', 'ERROR_CODE', 'what should be refused')
--   t.works('sql', 'what should be allowed')
\set cases `cat tests/content-cases.json`
select set_config('t.cases', :'cases', true);

create schema t;
grant usage on schema t to anon, authenticated;

create function t.new_user(p_name text, p_member boolean default false, p_ref text default null) returns uuid
security definer
language plpgsql as $$
declare u uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values (u, p_name || '@test.invalid', jsonb_strip_nulls(jsonb_build_object('username', p_name, 'ref', p_ref)));
  if p_member then update memberships set comp_active = true where user_id = u; end if;
  return u;
end $$;

create function t.act_as(u uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.sub', coalesce(u::text, ''), true);
  perform set_config('role', case when u is null then 'anon' else 'authenticated' end, true);
end $$;

create function t.as_system() returns void language plpgsql as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.sub', '', true);
end $$;

create function t.ok(cond boolean, what text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'FAILED: %', what; end if;
end $$;

create function t.fails(p_sql text, p_error text, what text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlerrm like p_error || '%' then return; end if;
    raise exception 'FAILED: % (expected %, got: %)', what, p_error, sqlerrm;
  end;
  raise exception 'FAILED: % (expected %, but it was allowed)', what, p_error;
end $$;

create function t.works(p_sql text, what text) returns void language plpgsql as $$
begin
  execute p_sql;
exception when others then
  raise exception 'FAILED: % (got: %)', what, sqlerrm;
end $$;

grant execute on all functions in schema t to anon, authenticated;
