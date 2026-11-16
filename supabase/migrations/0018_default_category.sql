-- Release 0.25: each collector can pick the category new items start in.
-- Null means the site's default. The app only offers real category keys (src/lib/categories.ts).
alter table public.profiles
  add column default_category text check (default_category ~ '^[a-z][a-z_]{1,39}$');
grant update (default_category) on public.profiles to authenticated;
