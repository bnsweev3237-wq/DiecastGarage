-- Release 0.13: standard details for every item, whatever its category.
-- Public (on items): status (owned, wishlist, sold), featured, star rating, quantity, edition or serial,
-- graded or COA details, provenance, tags and extra photos.
-- Private (on item_purchases): shipping, tax and fees, where it came from, where it's stored, and the sale.

alter table public.items
  add column status text not null default 'owned' check (status in ('owned', 'wishlist', 'sold')),
  add column featured boolean not null default false,
  add column rating smallint check (rating between 1 and 5),
  add column quantity integer not null default 1 check (quantity between 1 and 9999),
  add column edition text check (char_length(edition) <= 60),
  add column is_certified boolean not null default false,
  add column cert_type text check (cert_type in ('graded', 'coa')),
  add column cert_by text check (char_length(cert_by) <= 60),
  add column cert_grade text check (char_length(cert_grade) <= 20),
  add column cert_number text check (char_length(cert_number) <= 60),
  add column provenance text check (char_length(provenance) <= 2000),
  add column tags text[] not null default '{}' check (cardinality(tags) <= 10),
  add column photos text[] not null default '{}' check (cardinality(photos) <= 7);

-- Only items you own can be for sale.
alter table public.items add constraint for_sale_only_when_owned check (not for_sale or status = 'owned');

alter table public.item_purchases
  add column shipping numeric(12, 2) check (shipping >= 0),
  add column tax numeric(12, 2) check (tax >= 0),
  add column fees numeric(12, 2) check (fees >= 0),
  add column acquired_from text check (char_length(acquired_from) <= 100),
  add column storage_location text check (char_length(storage_location) <= 100),
  add column sold_price numeric(12, 2) check (sold_price >= 0),
  add column sold_at date;

-- Grading used to live in some categories' own fields. Move it to the shared fields.
update public.items
set is_certified = true,
    cert_type = case when category = 'autographs' then 'coa' else 'graded' end,
    cert_by = nullif(coalesce(attributes->>'grader', attributes->>'authentication'), ''),
    cert_grade = nullif(attributes->>'grade', '')
where coalesce(attributes->>'grader', attributes->>'authentication', '') not in ('', 'Raw (ungraded)', 'Unauthenticated')
   or coalesce(attributes->>'grade', '') <> '';
update public.items set attributes = attributes - 'grader' - 'grade' - 'authentication'
where attributes ?| array['grader', 'grade', 'authentication'];

create index items_owner_status_idx on public.items (owner_id, status);
