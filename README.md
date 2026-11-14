# theCollectorHQ

One home for collectors of everything (formerly Diecast Garage, then Racasto). Brand files are in `public/brand`.

A social site for collectors of every kind: cards, coins, comics, diecast, sneakers, toys and more. Members post their collection with photos, track what they paid and estimate value from sold listings, follow other collectors, comment on collections, and list items for sale through eBay.

- **Free accounts** keep up to 5 items. A paid **membership** (Stripe subscription) removes the limit.
- **Public or private** collections. What someone paid and their value estimates are always private to them.
- **For sale** requires a link to the item's eBay listing. Buyers check out on eBay.

Built with Next.js 14, Supabase (accounts, Postgres, photo storage) and Stripe (memberships).

## Set up (about 30 minutes)

### 1. Supabase (free tier is fine)
1. Create a project at supabase.com.
2. Open **SQL Editor**, run every file in `supabase/migrations` in number order (0001 through 0006). Together they create the tables, the 5-item free limit, the privacy rules and the photo storage buckets.
3. In **Authentication → URL Configuration**, set **Site URL** to your site's address and add `https://YOUR-SITE/auth/callback` to **Redirect URLs** (add `http://localhost:3000/auth/callback` too for local testing).
4. From **Project Settings → API**, copy the project URL, the `anon` key and the `service_role` key.

### 2. Stripe
1. In **Product catalog**, create a product "theCollectorHQ Membership" with a **recurring** price (for example $4.99/month). Copy the price ID (`price_...`).
2. In **Developers → API keys**, copy the secret key.
3. In **Developers → Webhooks**, add an endpoint `https://YOUR-SITE/api/stripe/webhook` listening for `customer.subscription.created`, `customer.subscription.updated` and `customer.subscription.deleted`. Copy its signing secret (`whsec_...`).
4. In **Settings → Billing → Customer portal**, turn the portal on so members can cancel or update their card.

Use test mode first; card `4242 4242 4242 4242` works for test payments.

### 3. Run it
```bash
cp .env.example .env.local   # fill in the values from steps 1 and 2
npm install
npm run dev                  # http://localhost:3000
```
For local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

### 4. Put it online
Push this folder to GitHub, import it at vercel.com, add the same environment variables (with `NEXT_PUBLIC_SITE_URL` set to your real address), and deploy. Then update the Supabase redirect URL and the Stripe webhook URL to that address.

## Where things are
| Path | What it does |
| --- | --- |
| `supabase/migrations/0001_init.sql` | Database, free limit, privacy rules, eBay link check, photo storage (later files add to it) |
| `src/app/actions.ts` | Saving items, sold listings, follows, comments, profile |
| `src/lib/categories.ts` | The categories and each one's extra fields (add a hobby here) |
| `src/lib/items.ts` | Value estimate (median of sold listings), eBay link check, search links |
| `src/app/collection` | Your own collection, totals and the item editor |
| `src/app/c/[username]` | Public collection and item pages with comments |
| `src/app/for-sale`, `src/app/feed` | For-sale listings and the feed from people you follow |
| `src/app/api/stripe` | Membership checkout, billing portal and webhook |

## Releases
Versions are `0.x` until the first public release, `1.0`. Release notes live in `src/lib/releases.ts` and show at `/release-notes`; the current version shows in the site footer. When you ship, add an entry there, bump `version` in `package.json`, and run any new file in `supabase/migrations` (in number order) in the SQL editor before deploying.

To change the free limit, edit `5` in `enforce_car_limit()` in the migration and `FREE_CAR_LIMIT` in `src/lib/limits.ts`.

## Before a public launch
- Add a terms of service and privacy policy page, and a way to report abusive comments.
- Turn on Supabase's email rate limits and CAPTCHA (Authentication → Attack Protection) to slow down spam sign-ups.
- If a membership lapses, the collector keeps every item but can't add more past 5.
