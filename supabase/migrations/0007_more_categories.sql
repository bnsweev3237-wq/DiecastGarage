-- Release 0.12: every eBay Collectibles subcategory becomes a category here (54 categories in all, Other included).
-- The list is too long to keep in a check, so the database checks only the key's shape;
-- the app maps any unknown key to "other" (CATEGORIES in src/lib/categories.ts).
alter table public.items drop constraint if exists items_category_check;
alter table public.items add constraint items_category_check check (category ~ '^[a-z][a-z_]{1,39}$');
