-- Collection goals (0033).

-- check: goals need what their kind needs, can only point at your own sets, and stop at 20
do $$
declare a uuid := t.new_user('goal_setter'); b uuid := t.new_user('goal_other'); mine uuid; theirs uuid;
begin
  perform t.act_as(b);
  insert into sets (name) values ('Their set') returning id into theirs;
  perform t.act_as(a);
  insert into sets (name) values ('My set') returning id into mine;
  perform t.works(format($q$insert into goals (kind, set_id) values ('set', %L)$q$, mine), 'a goal to finish your own set');
  perform t.works($q$insert into goals (kind, target) values ('items', 100)$q$, 'a goal of 100 items');
  perform t.works($q$insert into goals (kind, category, target, title) values ('category', 'diecast', 50, '50 diecast by summer')$q$, 'a category goal with a name');
  perform t.fails(format($q$insert into goals (kind, set_id) values ('set', %L)$q$, theirs), 'new row violates row-level security', 'a goal on someone else''s set');
  perform t.fails($q$insert into goals (kind) values ('items')$q$, 'new row for relation "goals" violates check constraint', 'an item goal with no number');
  perform t.fails($q$insert into goals (kind, target, title) values ('items', 10, 'see mysite.com')$q$, 'CONTENT_LINK:goal name', 'a link in a goal name');
  insert into goals (kind, target) select 'items', n from generate_series(1, 17) n;
  perform t.fails($q$insert into goals (kind, target) values ('items', 999)$q$, 'GOAL_LIMIT', 'a 21st goal');
end $$;

-- check: others see public goals only, and only on collections they can see
do $$
declare a uuid := t.new_user('goal_owner'); b uuid := t.new_user('goal_viewer');
begin
  perform t.act_as(a);
  insert into goals (kind, target) values ('items', 10);
  insert into goals (kind, target, is_public) values ('items', 20, false);
  perform t.act_as(b);
  perform t.ok((select count(*) = 1 from goals where owner_id = a), 'one public goal visible');
  perform t.as_system();
  update profiles set is_public = false where id = a;
  perform t.act_as(b);
  perform t.ok((select count(*) = 0 from goals where owner_id = a), 'nothing once the collection is private');
end $$;
