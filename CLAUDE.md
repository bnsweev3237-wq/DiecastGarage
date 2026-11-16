# theCollectorHQ: notes for working on this repo

Next.js 14 (App Router) + Supabase (Postgres, auth, storage) + Vercel. Live at https://thecollectorhq.com.

## Every release
1. Work on a branch (`v0.NN-short-name`), never straight on `main`.
2. Database changes go in a new numbered file in `supabase/migrations/` and are applied to the live database only after the owner says "ship it", before merging.
3. Add an entry at the top of `src/lib/releases.ts` and bump `version` in `package.json`.
4. **Update the Help page** (`src/lib/help.ts`) for anything people use that was added or changed, and set `HELP_UPDATED_FOR` to the release (major.minor). `npm run build` runs `scripts/check-help.mjs` and fails if Help is behind the newest release. Patch releases (0.33.1) don't need a Help change.
5. Push the branch for a Vercel preview, then merge to `main` on "ship it".

## Things that have bitten us
- **Name the owner link when joining items to profiles.** Tables like `item_ratings` and `favorites` give Supabase a second path between `items` and `profiles`, so embeds must say which: `owner:profiles!cars_owner_id_fkey(...)` and `items!cars_owner_id_fkey(count)`. Same for comments (`!comments_author_id_fkey`, `!comments_profile_id_fkey`) and notifications.
- Rules are enforced in the database as well as the app (content rules, free plan, member features, rate limits, blocking). Keep both in sync; comments in each file point to the other.
- PL/pgSQL doesn't short-circuit `AND` over record fields from different tables; split checks into separate `IF`s.
