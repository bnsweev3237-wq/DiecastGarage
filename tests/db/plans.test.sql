-- Free plan and member-only features (0009, 0014). Mirrors src/lib/limits.ts.

-- check: who counts as a member: paid, complimentary with no end, complimentary until a future date, but not after it ends
do $$
declare f uuid := t.new_user('free_one'); m uuid := t.new_user('comp_one', true); d uuid := t.new_user('dated_one'); x uuid := t.new_user('ended_one'); p uuid := t.new_user('paid_one');
begin
  update memberships set comp_active = true, comp_until = current_date + 30 where user_id = d;
  update memberships set comp_active = true, comp_until = current_date - 1 where user_id = x;
  update memberships set status = 'active' where user_id = p;
  perform t.ok(not is_member(f), 'a new account is free');
  perform t.ok(is_member(m), 'a complimentary membership with no end date');
  perform t.ok(is_member(d), 'a complimentary membership that ends later');
  perform t.ok(not is_member(x), 'a complimentary membership that has ended');
  perform t.ok(is_member(p), 'a paid membership');
end $$;

-- check: free accounts stop at 25 items, members don't
do $$
declare f uuid := t.new_user('free_two'); m uuid := t.new_user('member_two', true);
begin
  perform t.act_as(f);
  insert into items (title) select 'Item ' || n from generate_series(1, 25) n;
  perform t.fails($q$insert into items (title) values ('Item 26')$q$, 'FREE_LIMIT', 'a 26th item on the free plan');
  perform t.act_as(m);
  insert into items (title) select 'Item ' || n from generate_series(1, 26) n;
  perform t.ok((select count(*) from items where owner_id = m) = 26, 'members can have more than 25 items');
end $$;

-- check: free accounts can't list for sale or add extra photos, but keep photos they already have
do $$
declare f uuid := t.new_user('free_three'); it uuid;
begin
  perform t.act_as(f);
  perform t.fails($q$insert into items (title, for_sale, ebay_url) values ('Car', true, 'https://www.ebay.com/itm/1')$q$, 'MEMBERS_ONLY_SALE', 'listing for sale on the free plan');
  perform t.fails(format($q$insert into items (title, photo_path, photos) values ('Car', %L, array[%L])$q$, f || '/a.jpg', f || '/b.jpg'), 'MEMBERS_ONLY_PHOTOS', 'a second photo on the free plan');
  insert into items (title, photo_path) values ('Car', f || '/a.jpg') returning id into it;
  -- They were a member for a while and added a second photo, then the membership ended.
  perform t.as_system();
  update memberships set comp_active = true where user_id = f;
  perform t.act_as(f);
  update items set photos = array[f || '/b.jpg'] where id = it;
  perform t.as_system();
  update memberships set comp_active = false where user_id = f;
  perform t.act_as(f);
  perform t.works(format($q$update items set title = 'Car 2' where id = %L$q$, it), 'editing an item that kept its extra photos');
  perform t.fails(format($q$update items set photos = photos || %L::text where id = %L$q$, f || '/c.jpg', it), 'MEMBERS_ONLY_PHOTOS', 'adding another photo after membership ended');
end $$;

-- check: money fields are cleared for free accounts and kept for members; sold listings are members only
do $$
declare f uuid := t.new_user('free_four'); m uuid := t.new_user('member_four', true); fi uuid; mi uuid;
begin
  perform t.act_as(f);
  insert into items (title) values ('Card') returning id into fi;
  insert into item_purchases (item_id, paid, manual_value, storage_location) values (fi, 10, 50, 'Binder 2');
  perform t.ok((select paid is null and manual_value is null and storage_location = 'Binder 2' from item_purchases where item_id = fi), 'free: price and value cleared, storage kept');
  perform t.fails(format($q$insert into comps (item_id, price) values (%L, 20)$q$, fi), 'MEMBERS_ONLY_VALUES', 'logging a sold listing on the free plan');
  perform t.act_as(m);
  insert into items (title) values ('Card') returning id into mi;
  insert into item_purchases (item_id, paid, manual_value, condition_adjustment) values (mi, 10, 50, 15);
  perform t.ok((select paid = 10 and manual_value = 50 and condition_adjustment = 15 from item_purchases where item_id = mi), 'member: price, value and condition adjustment saved');
  perform t.works(format($q$insert into comps (item_id, price) values (%L, 20)$q$, mi), 'members log sold listings');
  -- A membership ending leaves saved values alone, but they can't be changed.
  perform t.as_system();
  update memberships set comp_active = false where user_id = m;
  perform t.act_as(m);
  update item_purchases set paid = 99, storage_location = 'Shelf' where item_id = mi;
  perform t.ok((select paid = 10 and storage_location = 'Shelf' from item_purchases where item_id = mi), 'after membership ends: price kept as it was, other fields still editable');
end $$;

-- check: daily value snapshot uses the same math as the app (median of sold listings minus condition adjustment, chosen extras in cost)
do $$
declare m uuid := t.new_user('member_five', true); f uuid := t.new_user('free_five'); a uuid; b uuid;
begin
  perform t.act_as(m);
  insert into items (title) values ('A') returning id into a;
  insert into items (title) values ('B') returning id into b;
  insert into item_purchases (item_id, paid, shipping, include_shipping, tax, manual_value) values (a, 10, 5, true, 2, 30);
  insert into item_purchases (item_id, paid, condition_adjustment) values (b, 4, 10);
  insert into comps (item_id, price) values (b, 10), (b, 20), (b, 40);
  perform t.act_as(f);
  insert into items (title) values ('Free item');
  perform t.as_system();
  perform take_collection_snapshots();
  perform t.ok((select items = 2 and cost = 19 and value = 48 and valued_items = 2 from collection_snapshots where owner_id = m),
    'member snapshot: cost 10+5 shipping (tax not ticked) + 4 = 19, value 30 + 20 median less 10% = 48');
  perform t.ok(not exists (select 1 from collection_snapshots where owner_id = f), 'free accounts get no snapshot');
end $$;
