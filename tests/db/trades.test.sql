-- Open to trades and trade matches (0031).

-- check: only owned items stay open to trade; selling one clears it
do $$
declare a uuid := t.new_user('trader_flag'); it uuid;
begin
  perform t.act_as(a);
  insert into items (title, open_to_trade) values ('Spare Charizard', true) returning id into it;
  perform t.ok((select open_to_trade from items where id = it), 'an owned item can be open to trade');
  update items set status = 'sold' where id = it;
  perform t.ok((select not open_to_trade from items where id = it), 'selling it clears open to trade');
  insert into items (title, status, open_to_trade) values ('Want this', 'wishlist', true) returning id into it;
  perform t.ok((select not open_to_trade from items where id = it), 'a wishlist item is never open to trade');
end $$;

-- check: two collectors with each other's wishlist items up for trade see a match both ways, and get notified
do $$
declare a uuid := t.new_user('trader_a'); b uuid := t.new_user('trader_b'); c uuid := t.new_user('trader_c');
        a_item uuid; b_item uuid;
begin
  perform t.act_as(a);
  insert into items (title, category, status) values ('Blastoise Base Set', 'cards', 'wishlist');
  insert into items (title, category, open_to_trade) values ('1999 Pokemon Charizard Base Set Holo', 'cards', true) returning id into a_item;
  perform t.act_as(b);
  insert into items (title, category, status) values ('Charizard Base Set', 'cards', 'wishlist');
  insert into items (title, category) values ('Blastoise 2/102 Base Set Unlimited', 'cards') returning id into b_item;
  update items set open_to_trade = true where id = b_item;
  perform t.act_as(c);
  insert into items (title, category, status) values ('Charizard Base Set', 'comics', 'wishlist'); -- different category
  perform t.act_as(a);
  perform t.ok((select count(*) = 1 from trade_matches() where direction = 'theirs' and item_id = b_item and other_id = b), 'A sees B''s Blastoise');
  perform t.ok((select count(*) = 1 from trade_matches() where direction = 'mine' and item_id = a_item and other_id = b), 'A sees that B wants their Charizard');
  perform t.ok((select count(*) = 0 from trade_matches() where other_id = c), 'no match across categories');
  perform t.act_as(b);
  perform t.ok((select count(*) = 2 from trade_matches() where other_id = a), 'B sees the same two-way match');
  perform t.as_system();
  perform t.ok((select count(*) = 1 from notifications where user_id = a and kind = 'trade_match' and item_id = b_item), 'A was notified when B''s item went up for trade');
  -- A's item went up before B added the wishlist item, so B finds it on the Trades page instead of an alert.
  perform t.ok((select count(*) = 0 from notifications where user_id = b and kind = 'trade_match'), 'no alert for an item that was already up for trade');
  -- Taking it off and putting it back up doesn't notify again.
  update items set open_to_trade = false where id = b_item;
  update items set open_to_trade = true where id = b_item;
  perform t.ok((select count(*) = 1 from notifications where user_id = a and kind = 'trade_match' and item_id = b_item), 'one trade alert per item');
end $$;

-- check: blocks and hidden items keep things out of trade matches; signed-out visitors can't ask
do $$
declare a uuid := t.new_user('match_blocker'); b uuid := t.new_user('match_blocked'); hid uuid;
begin
  perform t.act_as(a);
  insert into items (title, category, status) values ('Mickey Mantle 1952 Topps', 'cards', 'wishlist');
  perform t.act_as(b);
  insert into items (title, category, open_to_trade) values ('1952 Topps Mickey Mantle #311', 'cards', true);
  insert into items (title, category, open_to_trade, is_hidden) values ('1952 Topps Mickey Mantle reprint', 'cards', true, true) returning id into hid;
  perform t.act_as(a);
  perform t.ok((select count(*) = 1 from trade_matches() where other_id = b), 'one match: the hidden item is left out');
  insert into blocks (blocked_id) values (b);
  perform t.ok((select count(*) = 0 from trade_matches() where other_id = b), 'no matches with someone you blocked');
  perform t.act_as(b);
  perform t.ok((select count(*) = 0 from trade_matches() where other_id = a), 'or someone who blocked you');
  perform t.act_as(null);
  perform t.fails('select * from trade_matches()', 'permission denied', 'signed-out visitors');
end $$;
