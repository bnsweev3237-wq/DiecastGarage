-- Moves the 2 cars from the old Diecast Garage tracker into your account, with what you paid and their sold listings.
-- Paste into Supabase > SQL Editor > New query, and click Run. Running it twice won't create duplicates.
do $$
declare
  me uuid;
  car uuid;
begin
  select id into me from public.profiles where username = 'bnsweev';
  if me is null then
    raise exception 'No account with that username. Change the username on line 7 to yours.';
  end if;

  if not exists (select 1 from public.cars where owner_id = me and title = 'Coy Gibbs') then
    insert into public.cars (owner_id, title, brand, scale, year, description, boxed)
    values (me, 'Coy Gibbs', 'Action', '1:24', '2003', 'Busch Series, MBNA number 18 Joe Gibbs Racing', true)
    returning id into car;
    insert into public.car_purchases (car_id, owner_id, paid, purchased_at) values (car, me, 20, '2026-10-20');
    insert into public.comps (car_id, owner_id, price, source, sold_on) values (car, me, 20, 'eBay', '2026-10-20');
  end if;

  if not exists (select 1 from public.cars where owner_id = me and title = 'Martin Truex Jr. 2004 Long John Silvers') then
    insert into public.cars (owner_id, title, brand, scale, year, description, boxed)
    values (me, 'Martin Truex Jr. 2004 Long John Silvers', 'Action', '1:24', '2004',
            'Martin Truex Jr., 2004 Long John Silvers Busch Series Chevy Monte Carlo', true)
    returning id into car;
    insert into public.car_purchases (car_id, owner_id, paid, purchased_at) values (car, me, 9.99, '2026-10-17');
    insert into public.comps (car_id, owner_id, price, source, sold_on) values
      (car, me, 40, 'eBay', '2026-10-01'),
      (car, me, 49.99, 'eBay', '2026-09-29'),
      (car, me, 30.5, 'eBay', '2026-08-22');
  end if;
end $$;

select c.title, p.paid, count(k.id) as sold_listings
from public.cars c
join public.profiles u on u.id = c.owner_id and u.username = 'bnsweev'
left join public.car_purchases p on p.car_id = c.id
left join public.comps k on k.car_id = c.id
group by c.title, p.paid;
