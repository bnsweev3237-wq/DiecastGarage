-- Release 0.23: keep contact details and off-site deals out of public text.
-- No web links or domain names, phone numbers, email addresses, or payment apps in item details,
-- comments, profiles or location. Fields made for links (eBay listing, social profiles) are separate
-- and checked on their own. Same rules as src/lib/content-rules.ts, which gives friendlier messages first.
-- Only text that changes is checked, so older text never blocks an unrelated edit.

create or replace function public.content_problem(t text) returns text
language sql immutable as $$
  select case
    when t is null or t = '' then null
    -- email addresses, including "name at example dot com"
    when t ~* '([a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}|\m[a-z0-9._%+-]+\s*(\(at\)|\[at\])\s*[a-z0-9-]+)'
      then 'email'
    -- web addresses: http://, www., example.com, example [.] com, example dot com
    when t ~* '(https?://|www\.|\m[a-z0-9-]+(\.[a-z0-9-]+)*\s?(\.|\[\.\]|\(\.\))\s?(com|net|org|io|co|us|info|biz|shop|store|me|ly|gg|tv|app|xyz|ca|uk|de|au|site|online|link|club|live|page|to|cc)\M|\m[a-z0-9-]+\s+dot\s+(com|net|org)\M)'
      then 'link'
    -- US-style phone numbers: 555-123-4567, (555) 123 4567, +1 555.123.4567, 5551234567
    when t ~ '(^|[^0-9])(\+?1[\s.-]?)?\(?[2-9][0-9]{2}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}([^0-9]|$)'
      then 'phone'
    -- payment apps and cash tags: sales go through eBay
    when t ~* '(\m(venmo|zelle|paypal|cash\s?app|apple\s?pay|google\s?pay|chime)\M|(^|\s)\$[a-z][a-z0-9_]{2,})'
      then 'payment'
  end;
$$;

-- Raises CONTENT_<PROBLEM>:<field> for the first changed field that breaks a rule.
create or replace function public.check_content(fields text[], vals text[], olds text[]) returns void
language plpgsql as $$
declare i int; p text;
begin
  for i in 1 .. coalesce(array_length(fields, 1), 0) loop
    if vals[i] is distinct from olds[i] then
      p := public.content_problem(vals[i]);
      if p is not null then
        raise exception 'CONTENT_%:%', upper(p), fields[i] using errcode = 'check_violation';
      end if;
    end if;
  end loop;
end $$;

create or replace function public.items_content_rules() returns trigger
language plpgsql as $$
begin
  perform public.check_content(
    array['title', 'brand', 'description', 'provenance', 'edition', 'tags', 'details', 'year'],
    array[new.title, new.brand, new.description, new.provenance, new.edition, array_to_string(new.tags, ' , '),
          (select string_agg(value, ' | ') from jsonb_each_text(coalesce(new.attributes, '{}'::jsonb))), new.year],
    case when tg_op = 'UPDATE' then
      array[old.title, old.brand, old.description, old.provenance, old.edition, array_to_string(old.tags, ' , '),
            (select string_agg(value, ' | ') from jsonb_each_text(coalesce(old.attributes, '{}'::jsonb))), old.year]
    else array[]::text[] end);
  return new;
end $$;
create trigger items_content_rules before insert or update on public.items
  for each row execute function public.items_content_rules();

create or replace function public.comments_content_rules() returns trigger
language plpgsql as $$
begin
  perform public.check_content(array['comment'], array[new.body],
    case when tg_op = 'UPDATE' then array[old.body] else array[]::text[] end);
  return new;
end $$;
create trigger comments_content_rules before insert or update on public.comments
  for each row execute function public.comments_content_rules();

create or replace function public.profiles_content_rules() returns trigger
language plpgsql as $$
begin
  perform public.check_content(array['username', 'bio'], array[new.username, new.bio],
    case when tg_op = 'UPDATE' then array[old.username, old.bio] else array[]::text[] end);
  return new;
end $$;
create trigger profiles_content_rules before insert or update on public.profiles
  for each row execute function public.profiles_content_rules();

create or replace function public.profile_private_content_rules() returns trigger
language plpgsql as $$
begin
  perform public.check_content(array['location'], array[new.location],
    case when tg_op = 'UPDATE' then array[old.location] else array[]::text[] end);
  return new;
end $$;
create trigger profile_private_content_rules before insert or update on public.profile_private
  for each row execute function public.profile_private_content_rules();
