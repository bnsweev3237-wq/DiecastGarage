-- Sets (0026), wishlist alerts and invites (0027), and the error log (0028).

-- check: set entries linked to an item count as had, and set names follow the content rules
do $$
declare a uuid := t.new_user('set_owner'); s uuid; it uuid;
begin
  perform t.act_as(a);
  insert into items (title) values ('4/102 Charizard') returning id into it;
  insert into sets (name) values ('Base Set') returning id into s;
  insert into set_entries (set_id, position, label, item_id) values (s, 1, '4/102 Charizard', it);
  perform t.ok((select have from set_entries where set_id = s), 'a linked entry is ticked');
  perform t.fails($q$insert into sets (name) values ('Call 312-555-0199')$q$, 'CONTENT_PHONE:set name', 'a phone number in a set name');
end $$;

-- check: listing an item for sale alerts collectors whose wishlist item matches, once, and not if blocked
do $$
declare seller uuid := t.new_user('seller', true); fan uuid := t.new_user('fan'); other uuid := t.new_user('other_fan'); shy uuid := t.new_user('shy_fan');
        it uuid; it2 uuid;
begin
  perform t.act_as(fan);
  insert into items (title, category, status) values ('Charizard Base Set', 'trading_cards', 'wishlist');
  perform t.act_as(other);
  insert into items (title, category, status) values ('Blastoise Base Set', 'trading_cards', 'wishlist');
  perform t.act_as(shy);
  insert into items (title, category, status) values ('Charizard', 'trading_cards', 'wishlist');
  insert into blocks (blocked_id) values (seller);
  perform t.act_as(seller);
  insert into items (title, category, for_sale, ebay_url) values ('1999 Pokemon Base Set Charizard 4/102 Holo', 'trading_cards', true, 'https://www.ebay.com/itm/123') returning id into it;
  insert into items (title, category) values ('Charizard Base Set', 'comics') returning id into it2;
  update items set for_sale = true, ebay_url = 'https://www.ebay.com/itm/456' where id = it2;
  update items set for_sale = false where id = it;
  update items set for_sale = true where id = it;
  perform t.as_system();
  perform t.ok((select count(*) = 1 from notifications where user_id = fan and kind = 'wishlist_match'), 'the matching wishlist gets one alert (not again when relisted, not for another category)');
  perform t.ok(not exists (select 1 from notifications where user_id = other and kind = 'wishlist_match'), 'no alert when a word doesn''t match');
  perform t.ok(not exists (select 1 from notifications where user_id = shy and kind = 'wishlist_match'), 'no alert from someone you blocked');
end $$;

-- check: signing up with an invite link records who invited you, but not yourself or an unknown name
do $$
declare a uuid := t.new_user('inviter'); b uuid := t.new_user('invitee', false, 'Inviter'); c uuid := t.new_user('selfref', false, 'selfref'); d uuid := t.new_user('noref', false, 'nobody_here');
begin
  perform t.ok((select referred_by = a from profiles where id = b), 'invited by inviter');
  perform t.ok((select referred_by is null from profiles where id = c), 'can''t invite yourself');
  perform t.ok((select referred_by is null from profiles where id = d), 'unknown invite names are ignored');
end $$;

-- check: the error log groups repeats, and only the server can write or read it
do $$
declare a uuid := t.new_user('err_user');
begin
  perform t.as_system();
  perform t.ok(log_app_error('fp1', 'server', 'Boom', null, '/x', a), 'the first time an error happens it is new');
  perform t.ok(not log_app_error('fp1', 'server', 'Boom', null, '/x', null), 'a repeat is not new');
  perform t.ok((select count = 2 and user_id = a from app_errors where fingerprint = 'fp1'), 'repeats are counted on one row');
  update app_errors set status = 'resolved' where fingerprint = 'fp1';
  perform t.ok(log_app_error('fp1', 'server', 'Boom', null, '/x', null), 'it is new again after being marked resolved');
  perform t.act_as(a);
  perform t.fails($q$insert into app_errors (source, message, fingerprint) values ('server', 'x', 'y')$q$, 'permission denied', 'members can''t write to it');
  perform t.ok((select count(*) = 0 from app_errors), 'members can''t read it');
  perform t.fails($q$select log_app_error('fp2', 'server', 'x', null, null, null)$q$, 'permission denied', 'members can''t call the logger');
end $$;
