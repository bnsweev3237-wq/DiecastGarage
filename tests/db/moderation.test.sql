-- Reports, auto-hide and admin-only flags (0016, 0019, 0023).

-- check: 5 different people reporting an item hides it for review; 4, or one person reporting twice, doesn't
do $$
declare a uuid := t.new_user('reported'); it uuid; it2 uuid; r uuid; n int;
begin
  perform t.act_as(a);
  insert into items (title) values ('Item one') returning id into it;
  insert into items (title) values ('Item two') returning id into it2;
  for n in 1 .. 5 loop
    r := t.new_user('reporter' || n);
    perform t.act_as(r);
    if n < 5 then insert into reports (target_type, target_id, reason) values ('item', it2, 'spam'); end if;
    insert into reports (target_type, target_id, reason) values ('item', it, 'spam');
    if n = 4 then
      perform t.as_system();
      perform t.ok((select not under_review from items where id = it), 'still visible after 4 reports');
    end if;
  end loop;
  perform t.as_system();
  perform t.ok((select under_review from items where id = it), 'hidden for review after 5 reports');
  perform t.ok((select not under_review from items where id = it2), 'another item with 4 reports stays visible');
  perform t.ok((select bool_and(target_owner_id = a) from reports where target_id = it), 'reports record whose item it was');
  perform t.act_as(r);
  perform t.fails(format($q$insert into reports (target_type, target_id, reason) values ('item', %L, 'scam')$q$, it), 'duplicate key', 'one open report per person per item');
end $$;

-- check: collectors can't clear their own review flag or make themselves beta testers; the team can
do $$
declare a uuid := t.new_user('flagged'); it uuid;
begin
  perform t.act_as(a);
  insert into items (title) values ('Flagged item') returning id into it;
  perform t.as_system();
  update items set under_review = true where id = it;
  update profiles set under_review = true where id = a;
  perform t.act_as(a);
  update items set under_review = false where id = it;
  perform t.fails(format('update profiles set under_review = false where id = %L', a), 'permission denied', 'clearing your own review flag');
  perform t.fails(format('update profiles set is_beta_tester = true where id = %L', a), 'permission denied', 'making yourself a beta tester');
  perform t.works(format($q$update profiles set bio = 'Collector' where id = %L$q$, a), 'editing your own profile');
  perform t.ok((select under_review from items where id = it), 'item stays under review');
  perform t.ok((select under_review and not is_beta_tester from profiles where id = a), 'profile flags unchanged');
  perform t.as_system();
  update profiles set under_review = false, is_beta_tester = true where id = a;
  perform t.ok((select not under_review and is_beta_tester from profiles where id = a), 'the team can change them');
end $$;

-- check: items and collections under review can't be rated, saved or voted on
do $$
declare a uuid := t.new_user('review_owner'); b uuid := t.new_user('review_visitor'); it uuid; cm uuid;
begin
  perform t.act_as(a);
  insert into items (title) values ('Under review') returning id into it;
  insert into comments (profile_id, body) values (a, 'Hello visitors') returning id into cm;
  perform t.as_system();
  update profiles set under_review = true where id = a;
  perform t.act_as(b);
  perform t.fails(format('insert into item_ratings (item_id, stars) values (%L, 4)', it), 'RATING_NOT_ALLOWED', 'rating in a collection under review');
  perform t.fails(format('insert into favorites (item_id) values (%L)', it), 'FAVORITE_NOT_ALLOWED', 'saving in a collection under review');
  perform t.fails(format('insert into comment_votes (comment_id, value) values (%L, 1)', cm), 'VOTE_NOT_ALLOWED', 'voting in a collection under review');
end $$;

-- check: only beta testers can send feedback
do $$
declare a uuid := t.new_user('not_beta'); b uuid := t.new_user('beta_one');
begin
  perform t.as_system();
  update profiles set is_beta_tester = true where id = b;
  perform t.act_as(a);
  perform t.fails($q$insert into feedback (kind, message) values ('bug', 'It broke')$q$, 'new row violates row-level security', 'feedback from someone who isn''t a beta tester');
  perform t.act_as(b);
  perform t.works($q$insert into feedback (kind, message) values ('bug', 'It broke')$q$, 'feedback from a beta tester');
end $$;
