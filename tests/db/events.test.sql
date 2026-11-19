-- Card show calendar (0032).

-- check: members post upcoming events that follow the content rules; past and too-long events are refused
do $$
declare a uuid := t.new_user('show_poster');
begin
  perform t.act_as(a);
  perform t.works(format($q$insert into events (title, starts_on, ends_on, city, region, venue, address, hours, website)
    values ('Chicago Sun-Times Card Show', %L, %L, 'Rosemont', 'IL', 'Donald E. Stephens Convention Center', '5555 N River Rd', '9am-5pm', 'https://example.com/show')$q$,
    current_date + 10, current_date + 12), 'posting an upcoming show with a website');
  perform t.fails(format($q$insert into events (title, starts_on, ends_on, city, region) values ('Old show', %L, %L, 'Dayton', 'OH')$q$, current_date - 5, current_date - 5),
    'EVENT_IN_PAST', 'posting a show that already happened');
  perform t.fails(format($q$insert into events (title, starts_on, ends_on, city, region) values ('Forever show', %L, %L, 'Dayton', 'OH')$q$, current_date + 1, current_date + 30),
    'new row for relation "events" violates check constraint', 'a show longer than two weeks');
  perform t.fails(format($q$insert into events (title, starts_on, ends_on, city, region, description) values ('Swap meet', %L, %L, 'Dayton', 'OH', 'Call 937-555-0199 for tables')$q$, current_date + 3, current_date + 3),
    'CONTENT_PHONE:description', 'a phone number in the description');
  perform t.fails(format($q$insert into events (title, starts_on, ends_on, city, region, website) values ('Swap meet', %L, %L, 'Dayton', 'OH', 'javascript:alert(1)')$q$, current_date + 3, current_date + 3),
    'new row for relation "events" violates check constraint', 'a website that isn''t an https link');
end $$;

-- check: going counts, only for upcoming events, and members can't fake the count or clear a review
do $$
declare a uuid := t.new_user('show_host'); b uuid := t.new_user('show_goer'); c uuid := t.new_user('show_goer2'); e uuid;
begin
  perform t.act_as(a);
  insert into events (title, starts_on, ends_on, city, region) values ('Hot Wheels swap', current_date + 2, current_date + 2, 'Akron', 'OH') returning id into e;
  perform t.act_as(b);
  insert into event_rsvps (event_id) values (e);
  perform t.act_as(c);
  insert into event_rsvps (event_id) values (e);
  delete from event_rsvps where event_id = e;
  perform t.ok((select going_count = 1 from events where id = e), 'going count follows the RSVPs');
  perform t.act_as(a);
  perform t.fails(format('update events set going_count = 500 where id = %L', e), 'permission denied', 'faking the going count');
  perform t.fails(format('update events set under_review = false where id = %L', e), 'permission denied', 'clearing a review');
  update events set is_cancelled = true where id = e;
  perform t.act_as(c);
  perform t.fails(format('insert into event_rsvps (event_id) values (%L)', e), 'RSVP_NOT_ALLOWED', 'going to a cancelled event');
end $$;

-- check: 5 reports hide an event from everyone but the poster
do $$
declare a uuid := t.new_user('spam_poster'); e uuid; r uuid; n int;
begin
  perform t.act_as(a);
  insert into events (title, starts_on, ends_on, city, region) values ('Totally real show', current_date + 5, current_date + 5, 'Nowhere', 'TX') returning id into e;
  for n in 1 .. 5 loop
    r := t.new_user('event_reporter' || n);
    perform t.act_as(r);
    insert into reports (target_type, target_id, reason) values ('event', e, 'spam');
  end loop;
  perform t.ok((select count(*) = 0 from events where id = e), 'hidden from others after 5 reports');
  perform t.act_as(a);
  perform t.ok((select under_review from events where id = e), 'the poster still sees it, marked under review');
  perform t.as_system();
  perform t.ok((select bool_and(target_owner_id = a) from reports where target_id = e), 'reports record who posted it');
end $$;
