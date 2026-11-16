-- Content rules (0015). The examples are shared with the app's tests in tests/unit/content-rules.test.ts.

-- check: every blocked example is caught for the right reason
do $$
declare k text; v text;
begin
  for k, v in select key, jsonb_array_elements_text(value) from jsonb_each(current_setting('t.cases')::jsonb -> 'blocked') loop
    perform t.ok(content_problem(v) = k, format('"%s" should be blocked as %s, got %s', v, k, coalesce(content_problem(v), 'allowed')));
  end loop;
end $$;

-- check: every allowed example gets through
do $$
declare v text;
begin
  for v in select jsonb_array_elements_text(current_setting('t.cases')::jsonb -> 'allowed') loop
    perform t.ok(content_problem(v) is null, format('"%s" should be allowed, got %s', v, content_problem(v)));
  end loop;
end $$;

-- check: items, comments, profiles, private profiles and sets all apply the rules
do $$
declare a uuid := t.new_user('alice'); b uuid := t.new_user('bob'); it uuid;
begin
  perform t.act_as(a);
  perform t.fails($q$insert into items (title) values ('Charizard, see mysite.com')$q$, 'CONTENT_LINK:title', 'a link in an item title');
  perform t.fails($q$insert into items (title, tags) values ('Charizard', '{"call 312-555-0199"}')$q$, 'CONTENT_PHONE:tags', 'a phone number in tags');
  perform t.fails($q$insert into items (title, attributes) values ('Charizard', '{"set": "venmo me"}')$q$, 'CONTENT_PAYMENT:details', 'a payment app in category details');
  perform t.fails($q$update profiles set bio = 'email me bob@gmail.com' where id = auth.uid()$q$, 'CONTENT_EMAIL:', 'an email address in a bio');
  perform t.fails($q$insert into sets (name) values ('Base set www.example.net')$q$, 'CONTENT_LINK:set name', 'a link in a set name');
  insert into items (title) values ('Base Set Charizard 4/102') returning id into it;
  perform t.act_as(b);
  perform t.fails(format($q$insert into comments (profile_id, item_id, body) values (%L, %L, 'text me at 312 555 0199')$q$, a, it),
    'CONTENT_PHONE:comment', 'a phone number in a comment');
end $$;

-- check: text saved before a rule existed doesn't block editing other fields, but can't be changed to something new that breaks it
do $$
declare a uuid := t.new_user('carol'); it uuid;
begin
  perform t.as_system();
  set local session_replication_role = replica; -- skip triggers, as if saved before the rules
  insert into items (owner_id, title) values (a, 'Old listing, see oldsite.com') returning id into it;
  set local session_replication_role = origin;
  perform t.act_as(a);
  perform t.works(format($q$update items set brand = 'Topps' where id = %L$q$, it), 'editing another field of an item with old text');
  perform t.fails(format($q$update items set title = 'now see newsite.com' where id = %L$q$, it), 'CONTENT_LINK:title', 'changing to new text that breaks a rule');
end $$;
