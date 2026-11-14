-- Release 0.15: collectors choose whether shipping, tax and fees count toward gain or loss and profit.
-- Off by default, since eBay sold prices don't include any of them.
alter table public.item_purchases
  add column include_shipping boolean not null default false,
  add column include_tax boolean not null default false,
  add column include_fees boolean not null default false;
