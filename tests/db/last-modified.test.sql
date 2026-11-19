-- Last modified (0017, 0034).

-- check: changing what you paid or logging a sold listing updates the item's last modified time; ratings don't
do $$
declare a uuid := t.new_user('touch_member', true); b uuid := t.new_user('touch_rater'); it uuid; t0 timestamptz;
begin
  perform t.act_as(a);
  insert into items (title) values ('Goodwrench') returning id into it;
  insert into item_purchases (item_id, paid) values (it, 10);
  perform t.as_system();
  update items set updated_at = now() - interval '1 day' where id = it;
  select updated_at into t0 from items where id = it;
  perform t.act_as(a);
  update item_purchases set paid = 12 where item_id = it;
  perform t.ok((select updated_at > t0 from items where id = it), 'changing the price paid');
  perform t.as_system();
  update items set updated_at = now() - interval '1 day' where id = it;
  select updated_at into t0 from items where id = it;
  perform t.act_as(a);
  update item_purchases set paid = 12 where item_id = it;
  perform t.ok((select updated_at = t0 from items where id = it), 'saving the same price again changes nothing');
  insert into comps (item_id, price) values (it, 30);
  perform t.ok((select updated_at > t0 from items where id = it), 'logging a sold listing');
  perform t.as_system();
  update items set updated_at = now() - interval '1 day' where id = it;
  select updated_at into t0 from items where id = it;
  perform t.act_as(b);
  insert into item_ratings (item_id, stars) values (it, 5);
  perform t.ok((select updated_at = t0 from items where id = it), 'someone else rating it doesn''t count');
end $$;
