-- Release 0.20: search. Each item keeps a lowercase, accent-free search_text built from its public details,
-- so "pokemon charizard psa 10" finds "Pokémon … Charizard" graded PSA 10. A trigram index keeps
-- "contains" searches fast as the site grows. Private details (what you paid, where it's stored) stay out.
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

alter table public.items add column search_text text not null default '';

create or replace function public.items_search_text() returns trigger
language plpgsql set search_path = public, extensions as $$
begin
  new.search_text := lower(extensions.unaccent(concat_ws(' ',
    new.title, new.brand, new.year, new.category, new.edition,
    new.cert_by, new.cert_grade, new.cert_number,
    array_to_string(new.tags, ' '),
    (select string_agg(value, ' ') from jsonb_each_text(coalesce(new.attributes, '{}'::jsonb))),
    new.description)));
  return new;
end $$;

create trigger items_search_text before insert or update on public.items
  for each row execute function public.items_search_text();

update public.items set search_text = search_text; -- fills it in for existing items

create index items_search_trgm_idx on public.items using gin (search_text extensions.gin_trgm_ops);
create index profiles_username_trgm_idx on public.profiles using gin (username extensions.gin_trgm_ops);
