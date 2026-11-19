-- Leaderboards and trade reputation (0035).

-- check: you can only review someone you've talked with in comments, once each, and not yourself or a blocker
do $$
declare a uuid := t.new_user('rev_a'); b uuid := t.new_user('rev_b'); c uuid := t.new_user('rev_stranger'); d uuid := t.new_user('rev_blocker'); r uuid;
begin
  perform t.act_as(b);
  insert into comments (profile_id, body) values (a, 'Want to trade for your Charizard?');
  perform t.act_as(a);
  insert into comments (profile_id, body) values (d, 'Any interest in a swap?');
  perform t.works(format('insert into trade_reviews (reviewee_id, positive, note) values (%L, true, %L)', b, 'Fast shipping, well packed'), 'reviewing someone you talked with');
  perform t.fails(format('insert into trade_reviews (reviewee_id, positive) values (%L, true)', b), 'duplicate key', 'a second review of the same person');
  perform t.works(format('update trade_reviews set positive = false where reviewee_id = %L', b), 'changing your review');
  perform t.fails(format('insert into trade_reviews (reviewee_id, positive) values (%L, true)', c), 'REVIEW_NOT_ALLOWED', 'reviewing a stranger');
  perform t.fails(format('insert into trade_reviews (reviewee_id, positive) values (%L, true)', a), 'REVIEW_NOT_ALLOWED', 'reviewing yourself');
  perform t.act_as(d);
  insert into blocks (blocked_id) values (a);
  perform t.act_as(a);
  perform t.fails(format('insert into trade_reviews (reviewee_id, positive) values (%L, true)', d), 'REVIEW_NOT_ALLOWED', 'reviewing someone who blocked you');
  perform t.act_as(b);
  perform t.fails(format($q$insert into trade_reviews (reviewee_id, positive, note) values (%L, true, 'pay me on venmo')$q$, a), 'CONTENT_PAYMENT:review', 'a payment app in a review');
  perform t.as_system();
  perform t.ok((select count(*) = 1 from notifications where user_id = b and kind = 'trade_review' and actor_id = a), 'the reviewed collector is notified once');
  select id into r from trade_reviews where reviewer_id = a and reviewee_id = b;
  perform t.act_as(b);
  perform t.fails(format('update trade_reviews set under_review = true where id = %L', r), 'permission denied', 'hiding a review about you yourself');
end $$;

-- check: leaderboards count public, visible things only
do $$
declare a uuid := t.new_user('lb_public'); b uuid := t.new_user('lb_private'); c uuid := t.new_user('lb_rater1'); d uuid := t.new_user('lb_rater2'); it uuid; hid uuid;
begin
  perform t.act_as(a);
  insert into items (title) values ('Top card') returning id into it;
  insert into items (title, is_hidden) values ('Hidden card', true) returning id into hid;
  insert into items (title) select 'Filler ' || n from generate_series(1, 3) n;
  perform t.act_as(b);
  insert into items (title) select 'Private ' || n from generate_series(1, 9) n;
  perform t.as_system();
  update profiles set is_public = false where id = b;
  perform t.act_as(c);
  insert into item_ratings (item_id, stars) values (it, 5);
  insert into follows (followee_id) values (a);
  perform t.act_as(d);
  insert into item_ratings (item_id, stars) values (it, 4);
  perform t.act_as(null);
  perform t.ok((select count(*) = 1 from leaderboard_items() where item_id = it and ratings = 2), 'the rated item is on the board');
  perform t.ok((select added = 4 from leaderboard_growing() where profile_id = a), 'four visible items added (hidden one left out)');
  perform t.ok(not exists (select 1 from leaderboard_growing() where profile_id = b), 'private collections are left out');
  perform t.ok((select followers = 1 from leaderboard_followed() where profile_id = a), 'followers counted');
end $$;
