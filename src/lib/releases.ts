// Release notes, newest first. Versions are 0.x until the first public release, 1.0.
// When you ship, add an entry here and set the same number as "version" in package.json.
export type Release = { version: string; date: string; title: string; changes: string[] };

export const releases: Release[] = [
  {
    version: "0.29",
    date: "2026-11-16",
    title: "Box column and condition adjustment",
    changes: [
      "My collection has a Box column showing which items are in their original box or packaging.",
      "Members can set a condition adjustment on an item: a percent taken off the sold-listing estimate for wear, damage or missing parts. Your gain or loss and totals use the adjusted value.",
    ],
  },
  {
    version: "0.28",
    date: "2026-11-16",
    title: "Notices from the team",
    changes: [
      "If our team removes one of your items or photos, you'll get a notification (and an email, if you've turned emails on) explaining why.",
      "Admins: removing an item or photo asks for a reason and an optional note for the collector, and the report screen shows how many of a collector's items and comments were reported in the last 3 months.",
    ],
  },
  {
    version: "0.27",
    date: "2026-11-16",
    title: "Vote on comments",
    changes: [
      "Up vote or down vote other collectors' comments with ▲ and ▼. Click the same arrow again to take your vote back.",
      "The best-voted conversations show first, and replies stay in order underneath.",
      "A + Add an item button on your own collection page.",
      "Admins: feedback can be New, In review, Done or Dismissed.",
    ],
  },
  {
    version: "0.26",
    date: "2026-11-16",
    title: "Notifications, replies, beta feedback and more",
    changes: [
      "Beta testers have a 💬 Feedback button on every page to report bugs and share ideas. It notes which page you were on, so we can find the problem fast.",
      "Forgot your password? There's now a link on the sign-in page to get a reset email and choose a new one.",
      "New category: ⛽ Petroliana, for gas and oil signs, pump globes, oil cans and more.",
      "Reply directly to comments. Replies show under the comment they answer.",
      "Notifications: a 🔔 at the top shows how many new comments and replies you have. Click it to see them all.",
      "Optional emails for notifications. Turn them on or off in Settings → Notifications.",
    ],
  },
  {
    version: "0.25",
    date: "2026-11-16",
    title: "Your default category",
    changes: [
      "Pick the category new items start in, under Settings → Adding items. The category menu is set to it every time you add an item, and you can still change it per item.",
    ],
  },
  {
    version: "0.24",
    date: "2026-11-16",
    title: "Rate other collectors' items",
    changes: [
      "Rate any other collector's item from 1 to 5 stars on its page. Click your star again to take it back, or pick another to change it.",
      "Items show their average collector rating and how many people rated them.",
      "Explore now shows top-rated items first, with a Newest option. Rankings use a weighted average, so a single 5-star rating can't jump an item straight to the top.",
      "Your own My rating on your items stays separate and is labelled Owner's rating.",
      "Fix (0.24.1): Explore, item pages, For sale, Following and Search show items again.",
    ],
  },
  {
    version: "0.23",
    date: "2026-11-15",
    title: "Safer community",
    changes: [
      "Item details, tags, comments, About text and location can no longer include web links or website names, email addresses, phone numbers, or payment apps like Venmo, Zelle, PayPal and Cash App.",
      "Links still belong in their own places: the eBay listing field for items for sale, and your profile links in Settings.",
      "Profanity and slurs are blocked too, in item details, comments, profiles and usernames.",
      "If something is blocked, you'll see which field and why, so it's easy to fix.",
      "Block a collector from their page: they can't comment on your pages or follow you, and you won't see their comments. Manage your list in Settings.",
      "Anything reported by 5 different people is hidden until our team reviews it.",
      "Limits on very fast commenting, following, reporting and adding items, and the same long comment can't be pasted all over the site.",
    ],
  },
  {
    version: "0.22",
    date: "2026-11-15",
    title: "Filter by category and grails",
    changes: [
      "Collector pages have a search box, a category filter and a Grails only option, alongside the Collection, For sale, Wishlist and Sold tabs.",
      "My collection has a ★ Grails only button that works with search, categories, tags and sorting.",
      "The Search page can show grails only.",
    ],
  },
  {
    version: "0.21",
    date: "2026-11-15",
    title: "Free and member plans",
    changes: [
      "Free accounts now keep up to 25 items (up from 5), with one photo per item.",
      "Members get unlimited items, up to 8 photos each, and all the money features: what you paid, estimated values from sold listings, gain or loss, profit on sales, and listing items for sale.",
      "Free accounts can see every member feature, marked with a lock, so it's clear what membership adds.",
      "If a membership ends, everything already saved stays. You just can't add more of the member-only details.",
    ],
  },
  {
    version: "0.20",
    date: "2026-11-15",
    title: "Search",
    changes: [
      "A new Search page, in the menu: find items and collectors across the site by name, set, player, brand, grade, tags and more, with a category filter and a For sale only option.",
      "Accents don't matter: pokemon finds Pokémon. Every word has to match, so add words to narrow it down.",
      "Search your own collection, wishlist or sold items from My collection. It also looks at private details like where an item is stored.",
      "The For sale search now looks at all of an item's details, not just its name.",
    ],
  },
  {
    version: "0.19",
    date: "2026-11-15",
    title: "Sort your collection",
    changes: [
      "Sort My collection by last modified, recently added, oldest added, name, or highest value. Grails first is still the default.",
      "When sorting by date, each item shows when it was last edited or added.",
    ],
  },
  {
    version: "0.18",
    date: "2026-11-15",
    title: "Faster pages with smaller thumbnails",
    changes: [
      "Every item photo now gets a small copy for cards, lists and photo strips, so Explore and collection pages load much faster and use far less data.",
      "Item pages still show the full-size photo.",
      "Photos added before today get their small copies automatically.",
    ],
  },
  {
    version: "0.17",
    date: "2026-11-15",
    title: "Tidier tag filter",
    changes: [
      "In My collection, your tags now sit behind a Filter by tag dropdown instead of filling the page. The tag you're filtering by stays visible, with an ✕ to clear it.",
    ],
  },
  {
    version: "0.16",
    date: "2026-11-15",
    title: "Tidier photo storage",
    changes: [
      "Photos that were uploaded but never saved to an item or profile are now cleaned up automatically once a day, after they're a day old.",
      "When an admin removes an item, all of its photos are deleted, not just the cover.",
    ],
  },
  {
    version: "0.15",
    date: "2026-11-14",
    title: "You choose what counts in gain and loss",
    changes: [
      "Shipping, tax and fees each have an \"Include in gain/loss calculations\" box. They're left out unless you tick it, because eBay sold prices don't include them.",
      "Your choices apply to gain or loss against estimated value and to profit on items you've sold.",
      "Item pages say which amounts aren't being counted.",
    ],
  },
  {
    version: "0.14",
    date: "2026-11-14",
    title: "Complimentary memberships",
    changes: [
      "Admins can give any collector a free full membership, ending on a date or with no end date, and change or end it any time.",
      "Collectors with one see it in Settings, with when it ends.",
    ],
  },
  {
    version: "0.13",
    date: "2026-11-14",
    title: "Richer item details",
    changes: [
      "Up to 8 photos per item. Pick any one as the cover, and visitors can flip through them all.",
      "Graded or COA: tick the box to add who graded or certified it, the grade and the cert number. PSA, PCGS, NGC and CGC numbers get a Verify link.",
      "Rate items from 1 to 5 stars, and feature your grails so they show first on your page.",
      "Status: In my collection, Wishlist or Sold. Keep sold items on record with the sale price and see your real profit.",
      "Quantity, edition or serial number, tags, and provenance and history for every item.",
      "Private extras: shipping, tax and fees for your true cost, where you got it, and where it's stored.",
      "My collection has Collection, Wishlist and Sold tabs, plus tag filters.",
    ],
  },
  {
    version: "0.12",
    date: "2026-11-14",
    title: "Every eBay collectibles category",
    changes: [
      "54 categories: every Collectibles category on eBay, from Advertising, Autographs and Breweriana to Militaria, Postcards and Tobacciana, plus our popular hobbies.",
      "Each new category has its own details, like the signer and authenticator for autographs, or the war and branch for militaria.",
      "Category menus are grouped into Popular, More collectibles and Something else.",
      "A new All categories page, linked from Explore.",
    ],
  },
  {
    version: "0.11",
    date: "2026-11-14",
    title: "Turned up the excitement",
    changes: [
      "A bold new Explore page: a big headline, live counts of items, collectors and items for sale, and a scrolling ticker of every hobby.",
      "Browse by category with chunky emoji buttons.",
      "Item cards now show a category sticker on the photo and a price tag on items for sale, with a punchier hover.",
      "New How it works section for visitors, and a Collectors to follow section with profile pictures.",
      "Racing stripes and an orange speed line on page banners.",
    ],
  },
  {
    version: "0.10",
    date: "2026-11-14",
    title: "We're theCollectorHQ",
    changes: [
      "New name: theCollectorHQ, home base for collectors of everything.",
      "A bold new logo and look: black, white and orange, with sporty headings.",
      "New app icon. If you installed the app, remove it and install it again to get the new name and icon.",
    ],
  },
  {
    version: "0.9",
    date: "2026-11-12",
    title: "Install the app",
    changes: [
      "Add The Collectors Association to your phone's home screen or your computer like an app: tap Install on Android and in Chrome or Edge, or Share then Add to Home Screen on iPhone.",
      "Opens full-screen with its own icon, and long-press the icon for shortcuts to Add an item and My collection.",
      "A friendly page instead of an error when you're offline.",
      "Find install instructions any time under Settings, Get the app.",
    ],
  },
  {
    version: "0.8",
    date: "2026-11-12",
    title: "Welcome to The Collectors Association",
    changes: [
      "New name and look: The Collectors Association, one home for collectors of everything.",
      "Collect anything: trading cards, coins, comics, diecast, sneakers, toys, LEGO, Funko, vinyl, video games and more.",
      "Each category has its own details, like set, card number and grade for cards, or year, mint mark and grade for coins.",
      "Add the condition of each item, and whether it's still in its original packaging.",
      "Filter your collection, Explore and For sale by category.",
      "\"My garage\" is now \"My collection\". Old links still work.",
    ],
  },
  {
    version: "0.7",
    date: "2026-11-11",
    title: "Diecast Garage is now Racasto",
    changes: [
      "New name: Racasto, The Diecast Racing Society.",
      "New logo: a slanted red badge with a twin-stripe R.",
      "New icons for your browser tab and phone home screen, and a preview image when you share a link.",
    ],
  },
  {
    version: "0.6",
    date: "2026-11-10",
    title: "New look",
    changes: [
      "A fresh, racing-inspired design across the whole site: bold slanted headings, a black header band and race-red accents.",
      "Collection pages open with a big header showing the collector, their stats and links.",
      "Item cards show brand, scale, year and box at a glance, with an outline drawing until a photo is added.",
      "The site switches to a dark version automatically when your phone or computer is in dark mode.",
      "A cleaner header on phones, with sections you can swipe through.",
    ],
  },
  {
    version: "0.5",
    date: "2026-11-10",
    title: "Reporting and account deletion",
    changes: [
      "Report a car, comment or collector that breaks the rules. Reports are private.",
      "Delete your account and everything in it from Settings.",
      "Sign-up is ready to ask you to agree to the Terms of Service and Privacy Policy once they're published.",
    ],
  },
  {
    version: "0.4",
    date: "2026-11-10",
    title: "Profile pictures and links",
    changes: [
      "Add a profile picture. It shows on your public page and next to your comments.",
      "Add links to your Facebook, X, Instagram and eBay profiles. Paste a link or just type your username.",
    ],
  },
  {
    version: "0.3",
    date: "2026-11-10",
    title: "More privacy choices",
    changes: [
      "Hide a single car from your public page while the rest of your collection stays public. Hidden cars also stay off the For sale page, Explore and feeds.",
      "Choose who can comment on your collection: everyone, only collectors you follow, or nobody.",
      "Add your location (city and state). It's private unless you choose to show it on your public page and for-sale cars.",
      "See who a collector follows and who follows them. You can keep your own lists private; your counts still show.",
    ],
  },
  {
    version: "0.2",
    date: "2026-11-10",
    title: "Privacy settings",
    changes: [
      "Your full name is now private. Other collectors see your username.",
      "Choose whether your public page shows your email address. It's hidden unless you turn it on.",
      "Choose whether your public page shows your cars' estimated values and the collection total. Hidden unless you turn it on.",
      "What you paid, gain or loss, purchase dates and the sold listings you log are always private.",
      "Sign-up asks for your full name and says it stays private.",
      "Release notes and version numbers.",
    ],
  },
  {
    version: "0.1",
    date: "2026-11-10",
    title: "First test version",
    changes: [
      "Sign up free and keep up to 5 cars. Memberships for unlimited cars are coming soon.",
      "Add cars with a photo, brand, scale, year, description and whether they have the original box.",
      "Track what you paid and estimate each car's value from sold eBay and Facebook Marketplace listings.",
      "Public or private collections, following other collectors, and comments on collections and cars.",
      "Mark a car for sale with a link to its eBay listing. For-sale cars appear on the For sale page.",
    ],
  },
];

export const currentVersion = releases[0].version;
