-- Two-step sign-in (0036).

-- check: with two-step on, the password alone can't read or change anything; with the code it can
do $$
declare a uuid := t.new_user('twostep_on'); b uuid := t.new_user('twostep_off'); it uuid;
begin
  perform t.act_as(a);
  insert into items (title) values ('Before turning it on') returning id into it;
  perform t.as_system();
  insert into auth.mfa_factors (user_id, status) values (a, 'verified');
  perform t.act_as(a, 'aal1');
  perform t.ok((select count(*) = 0 from items where owner_id = a), 'password only: can''t even see their own items');
  perform t.fails($q$insert into items (title) values ('Sneaky')$q$, 'new row violates row-level security', 'password only: can''t add items');
  update profiles set bio = 'changed' where id = a;
  perform t.as_system();
  perform t.ok((select bio is null from profiles where id = a), 'password only: profile unchanged');
  perform t.act_as(a, 'aal2');
  perform t.ok((select count(*) = 1 from items where owner_id = a), 'with the code: sees their items');
  perform t.works($q$insert into items (title) values ('After the code')$q$, 'with the code: can add items');
  perform t.act_as(b, 'aal1');
  perform t.ok((select count(*) = 2 from items where owner_id = a), 'collectors without two-step are unaffected (and can see the public items)');
  perform t.works($q$insert into items (title) values ('No two-step needed')$q$, 'and can add items with just a password');
  perform t.as_system();
  insert into auth.mfa_factors (user_id, status) values (b, 'unverified');
  perform t.act_as(b, 'aal1');
  perform t.works($q$insert into items (title) values ('Half set up')$q$, 'an unfinished setup doesn''t lock anyone out');
end $$;
