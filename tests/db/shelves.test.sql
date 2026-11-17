-- Shelves (0030).

-- check: you can put your own items on your own shelves, but not someone else's items or shelves
do $$
declare a uuid := t.new_user('shelf_owner'); b uuid := t.new_user('shelf_other'); s uuid; mine uuid; theirs uuid;
begin
  perform t.act_as(b);
  insert into items (title) values ('Not yours') returning id into theirs;
  perform t.act_as(a);
  insert into items (title) values ('Earnhardt Goodwrench') returning id into mine;
  insert into shelves (name) values ('Earnhardt shelf') returning id into s;
  perform t.works(format('insert into shelf_items (shelf_id, item_id) values (%L, %L)', s, mine), 'adding your own item');
  perform t.fails(format('insert into shelf_items (shelf_id, item_id) values (%L, %L)', s, theirs), 'new row violates row-level security', 'adding someone else''s item');
  perform t.act_as(b);
  perform t.fails(format('insert into shelf_items (shelf_id, item_id) values (%L, %L)', s, theirs), 'new row violates row-level security', 'adding to someone else''s shelf');
  perform t.fails($q$insert into shelves (name) values ('Call 312-555-0199')$q$, 'CONTENT_PHONE:shelf name', 'a phone number in a shelf name');
end $$;

-- check: others see public shelves without hidden items; private shelves stay private
do $$
declare a uuid := t.new_user('display_owner'); b uuid := t.new_user('display_visitor'); pub uuid; priv uuid; shown uuid; hid uuid;
begin
  perform t.act_as(a);
  insert into items (title) values ('Shown') returning id into shown;
  insert into items (title, is_hidden) values ('Hidden', true) returning id into hid;
  insert into shelves (name) values ('Public shelf') returning id into pub;
  insert into shelves (name, is_public) values ('Private shelf', false) returning id into priv;
  insert into shelf_items (shelf_id, item_id) values (pub, shown), (pub, hid), (priv, shown);
  perform t.act_as(b);
  perform t.ok((select count(*) = 1 from shelves where owner_id = a), 'only the public shelf is visible');
  perform t.ok((select count(*) = 1 from shelf_items where shelf_id = pub), 'the hidden item is left out');
  perform t.ok((select count(*) = 0 from shelf_items where shelf_id = priv), 'nothing from the private shelf');
  perform t.act_as(a);
  perform t.ok((select count(*) = 2 from shelf_items where shelf_id = pub), 'the owner sees everything on their shelf');
end $$;

-- check: 50 shelves per collector and 200 items per shelf
do $$
declare a uuid := t.new_user('shelf_hoarder', true); s uuid;
begin
  perform t.act_as(a);
  insert into shelves (name) select 'Shelf ' || n from generate_series(1, 50) n;
  perform t.fails($q$insert into shelves (name) values ('One too many')$q$, 'SHELF_LIMIT', 'a 51st shelf');
  select id into s from shelves where owner_id = a limit 1;
  insert into items (title) select 'Item ' || n from generate_series(1, 201) n;
  insert into shelf_items (shelf_id, item_id) select s, id from items where owner_id = a order by title limit 200;
  perform t.fails(format('insert into shelf_items (shelf_id, item_id) select %L, id from items where owner_id = %L and id not in (select item_id from shelf_items where shelf_id = %L) limit 1', s, a, s),
    'SHELF_ITEM_LIMIT', 'a 201st item on a shelf');
end $$;
