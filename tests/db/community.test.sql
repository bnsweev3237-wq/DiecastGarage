-- Ratings (0017), comments, replies and notifications (0020, 0025), comment votes (0021), saves (0025)
-- and blocking (0016).

-- check: ratings update the item's totals and score, notify the owner, and can't be on your own or hidden items
do $$
declare a uuid := t.new_user('owner_a'); b uuid := t.new_user('rater_b'); c uuid := t.new_user('rater_c'); it uuid; hid uuid;
begin
  perform t.act_as(a);
  insert into items (title) values ('Charizard') returning id into it;
  insert into items (title, is_hidden) values ('Secret', true) returning id into hid;
  perform t.fails(format('insert into item_ratings (item_id, stars) values (%L, 5)', it), 'RATING_OWN_ITEM', 'rating your own item');
  perform t.act_as(b);
  insert into item_ratings (item_id, stars) values (it, 5);
  perform t.act_as(c);
  insert into item_ratings (item_id, stars) values (it, 2);
  perform t.fails(format('insert into item_ratings (item_id, stars) values (%L, 5)', hid), 'RATING_NOT_ALLOWED', 'rating a hidden item');
  perform t.ok((select rating_count = 2 and rating_avg = 3.5 and rating_score = 3.2 from items where id = it), 'totals: 2 ratings, 3.5 average, score (9+7)/(3+2) = 3.2');
  perform t.as_system();
  perform t.ok((select count(*) = 2 from notifications where user_id = a and kind = 'rating' and item_id = it), 'the owner is notified of each rating');
  perform t.act_as(c);
  delete from item_ratings where item_id = it;
  perform t.ok((select rating_count = 1 and rating_score = 3.5 from items where id = it), 'taking a rating back updates the totals');
end $$;

-- check: owners can't edit their own rating totals
do $$
declare a uuid := t.new_user('owner_tot'); it uuid;
begin
  perform t.act_as(a);
  insert into items (title) values ('Car') returning id into it;
  update items set rating_count = 99, rating_score = 5 where id = it;
  perform t.ok((select rating_count = 0 and rating_score = 3 from items where id = it), 'rating totals stay as the database set them');
end $$;

-- check: comments and replies notify the right people, and replies stay on the same page, one level deep
do $$
declare a uuid := t.new_user('page_owner'); b uuid := t.new_user('commenter'); c uuid := t.new_user('replier');
        it uuid; other uuid; top uuid; r1 uuid; r2 uuid;
begin
  perform t.act_as(a);
  insert into items (title) values ('Mustang') returning id into it;
  insert into items (title) values ('Camaro') returning id into other;
  perform t.act_as(b);
  insert into comments (profile_id, item_id, body) values (a, it, 'Great find!') returning id into top;
  perform t.act_as(c);
  insert into comments (profile_id, item_id, body, parent_id) values (a, it, 'Agreed', top) returning id into r1;
  perform t.fails(format($q$insert into comments (profile_id, item_id, body, parent_id) values (%L, %L, 'Wrong page', %L)$q$, a, other, top), 'REPLY_WRONG_PAGE', 'a reply on a different item');
  -- The app's Reply box answers the thread, so a reply naming another reply joins the thread too.
  perform t.act_as(a);
  insert into comments (profile_id, item_id, body, parent_id) values (a, it, 'Thanks both', r1) returning id into r2;
  perform t.as_system();
  perform t.ok((select parent_id = top from comments where id = r2), 'replying to a reply joins the same thread');
  perform t.ok(exists (select 1 from notifications where user_id = a and kind = 'comment_item' and comment_id = top), 'owner told about the comment');
  perform t.ok(exists (select 1 from notifications where user_id = b and kind = 'reply' and comment_id = r1), 'commenter told about the reply');
  perform t.ok(exists (select 1 from notifications where user_id = b and kind = 'reply' and comment_id = r2), 'thread starter told about the owner''s reply');
  perform t.ok(not exists (select 1 from notifications where user_id = a and comment_id = r2), 'nobody is told about their own comment');
end $$;

-- check: the same long comment can't be posted over and over
do $$
declare a uuid := t.new_user('dup_owner'); b uuid := t.new_user('dup_poster');
begin
  perform t.act_as(b);
  insert into comments (profile_id, body) values (a, 'Nice collection you have here'), (a, 'Nice collection  you have here');
  perform t.fails(format($q$insert into comments (profile_id, body) values (%L, 'nice collection you have here')$q$, a), 'DUPLICATE_COMMENT', 'a third copy of the same comment');
end $$;

-- check: votes add up, can be changed, and can't be on your own comment
do $$
declare a uuid := t.new_user('vote_owner'); b uuid := t.new_user('voter_b'); c uuid := t.new_user('voter_c'); cm uuid;
begin
  perform t.act_as(a);
  insert into comments (profile_id, body) values (a, 'Welcome to my page') returning id into cm;
  perform t.fails(format('insert into comment_votes (comment_id, value) values (%L, 1)', cm), 'VOTE_OWN_COMMENT', 'voting on your own comment');
  perform t.act_as(b);
  insert into comment_votes (comment_id, value) values (cm, 1);
  perform t.act_as(c);
  insert into comment_votes (comment_id, value) values (cm, 1);
  update comment_votes set value = -1 where comment_id = cm;
  perform t.ok((select score = 0 and upvotes = 1 and downvotes = 1 from comments where id = cm), 'one up and one down vote');
end $$;

-- check: saves are for other people's visible items only
do $$
declare a uuid := t.new_user('save_owner'); b uuid := t.new_user('saver'); it uuid; hid uuid;
begin
  perform t.act_as(a);
  insert into items (title) values ('Pikachu') returning id into it;
  insert into items (title, is_hidden) values ('Hidden', true) returning id into hid;
  perform t.fails(format('insert into favorites (item_id) values (%L)', it), 'FAVORITE_OWN_ITEM', 'saving your own item');
  perform t.act_as(b);
  perform t.works(format('insert into favorites (item_id) values (%L)', it), 'saving someone else''s item');
  perform t.fails(format('insert into favorites (item_id) values (%L)', hid), 'FAVORITE_NOT_ALLOWED', 'saving a hidden item');
end $$;

-- check: following notifies, and followers hear about new items
do $$
declare a uuid := t.new_user('followed'); b uuid := t.new_user('follower');
begin
  perform t.act_as(b);
  insert into follows (followee_id) values (a);
  perform t.act_as(a);
  insert into items (title) values ('New arrival');
  insert into items (title, status) values ('Wanted', 'wishlist');
  perform t.as_system();
  perform t.ok(exists (select 1 from notifications where user_id = a and kind = 'follow' and actor_id = b), 'told about the new follower');
  perform t.ok((select count(*) = 1 from notifications where user_id = b and kind = 'new_item'), 'follower told once about new items (not wishlist items)');
end $$;

-- check: blocking stops comments, follows, ratings and votes, and removes existing follows both ways
do $$
declare a uuid := t.new_user('blocker'); b uuid := t.new_user('blocked'); it uuid; cm uuid;
begin
  perform t.act_as(a);
  insert into items (title) values ('Charger') returning id into it;
  insert into comments (profile_id, body) values (a, 'Thanks for visiting') returning id into cm;
  insert into follows (followee_id) values (b);
  perform t.act_as(b);
  insert into follows (followee_id) values (a);
  perform t.act_as(a);
  insert into blocks (blocked_id) values (b);
  perform t.as_system();
  perform t.ok(not exists (select 1 from follows where (follower_id = a and followee_id = b) or (follower_id = b and followee_id = a)), 'follows removed both ways');
  perform t.act_as(b);
  perform t.fails(format($q$insert into comments (profile_id, body) values (%L, 'hello')$q$, a), 'BLOCKED', 'commenting on the blocker''s page');
  perform t.fails(format('insert into follows (followee_id) values (%L)', a), 'BLOCKED', 'following the blocker');
  perform t.fails(format('insert into item_ratings (item_id, stars) values (%L, 1)', it), 'BLOCKED', 'rating the blocker''s item');
  perform t.fails(format('insert into comment_votes (comment_id, value) values (%L, -1)', cm), 'BLOCKED', 'voting on the blocker''s comment');
  perform t.act_as(a);
  perform t.fails(format('insert into follows (followee_id) values (%L)', b), 'BLOCKED', 'the blocker can''t follow them either');
end $$;
