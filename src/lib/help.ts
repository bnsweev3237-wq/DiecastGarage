// The Help page (/help). Plain-language directions for every part of theCollectorHQ.
//
// KEEP THIS UP TO DATE: every release that adds or changes something people use must update the
// matching section here, then set HELP_UPDATED_FOR to that release's version. The build checks it
// (scripts/check-help.mjs) and fails if the newest version in src/lib/releases.ts is newer than this.
//
// Writing format: each section has paragraphs. A line starting with "- " is a bullet.
// **bold** and [link text](/path) work inside any line.

export const HELP_UPDATED_FOR = "0.44";

export type HelpSection = { id: string; emoji: string; title: string; body: string[] };

export const HELP: HelpSection[] = [
  {
    id: "getting-started", emoji: "👋", title: "Getting started",
    body: [
      "theCollectorHQ is a home for every kind of collection: cards, coins, comics, diecast, sneakers, toys and 50+ other categories. Catalog what you own, track what it's worth, and share it with other collectors.",
      "- **Sign up** with [Join free](/signup). Pick a username: it's how other collectors see you, and your page will be at thecollectorhq.com/c/yourname.",
      "- **Confirm your email** using the link we send you.",
      "- **Set up your profile** in [Settings](/settings): a profile picture, About text, your location (private unless you choose to show it), and links to your Facebook, X, Instagram and eBay.",
      "- **Pick your default category** in Settings → Adding items, so new items start in the category you collect most.",
      "- **Install the app** (optional): on Android or in Chrome or Edge tap Install; on iPhone tap Share then Add to Home Screen. Find the steps any time in Settings.",
    ],
  },
  {
    id: "adding-items", emoji: "➕", title: "Adding items",
    body: [
      "Click **+ Add an item** on [My collection](/collection) or your own page. The form has two parts: the item itself, then Purchase and value.",
      "- **Status:** In my collection, Wishlist (something you're hunting for) or Sold (keep it on record with what you sold it for).",
      "- **Photos:** the first photo is the cover. Tap ★ on another photo to make it the cover, or ✕ to remove it. Free accounts get 1 photo per item; members get up to 8.",
      "- **Category and details:** each category asks for its own details, like set and card number for cards, or scale and series for diecast.",
      "- **Sports:** sports cards go under **Trading cards**. Everything else, like signed balls, jerseys, helmets, bobbleheads and programs, goes under **Sports memorabilia**: Baseball, Basketball, Football, Hockey, Soccer, Motorsports, Wrestling, Golf, Boxing & MMA, College sports, Olympics, Tennis, Horse racing, Fishing & hunting or Other sports. Each asks for the type of item, the team and the player or driver.",
      "- **Condition, box or packaging, quantity, and edition or serial number.**",
      "- **Graded or COA:** tick the box to add who graded or certified it, the grade and the cert number. PSA, PCGS, NGC and CGC numbers get a Verify link others can use.",
      "- **My rating** (1 to 5 stars) is your own opinion of the item. **Feature it** marks it as one of your grails, shown first on your page.",
      "- **Tags** are your own labels, separated by commas, like Earnhardt, PC, Trade bait.",
      "- **Description** and **Provenance and history** for anything worth knowing.",
      "- **Hide this item** keeps it off your public page; only you will see it.",
      "On any of your items, **＋ Add a new item** starts a blank one, and **＋ Add another like this** starts a new item with the same details filled in. Change what's different, add photos and save.",
      "After you click **Save changes**, you go back to My collection with a note saying what was saved.",
    ],
  },
  {
    id: "my-collection", emoji: "🗂️", title: "My collection",
    body: [
      "[My collection](/collection) lists everything you've added, with tabs for **Collection**, **Wishlist** and **Sold**.",
      "- **Search** your items, including private details like where they're stored.",
      "- **Filter** by category, by tag (the Filter by tag dropdown) or **★ Grails only**.",
      "- **Sort:** the list starts with what you changed most recently (last modified). You can also sort by grails first, recently added, oldest, name, or highest value.",
      "- The **Box** column shows a ✓ for items with their original box or packaging.",
      "- Members see totals for cost, estimated value and gain or loss at the top, and a **Value over time** chart.",
      "The row of tools under the heading: **📋 Sets**, **🗄️ Shelves**, **🎯 Goals**, **📊 Insights** (members), **🔁 Trades**, **🧩 Duplicates**, **🎪 Show mode**, **♥ Saved**, **Bulk edit**, **Import** and **Export**.",
    ],
  },
  {
    id: "values", emoji: "💰", title: "Values, cost and gain or loss (members)",
    body: [
      "Members can track what each item cost and what it's worth.",
      "- **Price paid**, date bought, shipping, tax and fees go in the Purchase and value part of the item. Only you can see them.",
      "- Shipping, tax and fees are left out of gain or loss unless you tick **Include in gain/loss calculations** under each one, because eBay sold prices don't include them either.",
      "- **Estimated value** comes from sold listings you log on the item's page. Use the eBay sold listings and Facebook Marketplace buttons to look them up, then add what similar items sold for. We use the middle (median) price from the last 12 months, ignoring the highest and lowest once you have 5 or more.",
      "- **Your value** overrides the estimate if you'd rather set it yourself.",
      "- **Condition adjustment (%)** takes a percent off the sold-listing estimate for wear, damage or missing parts. It isn't used when you enter your own value.",
      "- **Gain or loss** compares the value to what it cost. For sold items you see your **profit** instead.",
      "- **📈 Value history** on each item: once you've logged 2 or more sold listings with a date, a chart shows each sale and the middle price each month, and how much it's gone up or down.",
      "- **📈 Value over time** on My collection records your collection's value once a day.",
      "- **🛡️ Collection report:** from the link under the chart, open a printable list of everything you own with photos, grading, cost and value. Use **Print or save as PDF** for insurance or your records.",
    ],
  },
  {
    id: "bulk-import", emoji: "📥", title: "Bulk edit, import and export",
    body: [
      "**Bulk edit** (on My collection): tick items, then add or remove tags, move them to a category, set where they're stored, hide or show them, mark them boxed, or mark them open to trade, all at once. Anything you leave empty stays as it is.",
      "**Import** (on My collection): add up to 500 items at a time from a spreadsheet.",
      "- Save your spreadsheet as **CSV** (Excel: File → Save As → CSV; Google Sheets: File → Download → CSV).",
      "- Choose the file. We match each column for you; change any that are wrong or choose Skip.",
      "- Click Import. You'll see how many were added and which rows had problems. Photos aren't imported, so add those from each item afterwards.",
      "**Export** (on My collection): download your whole collection as a spreadsheet, including private details. It uses the same columns as Import, so you can edit it and import it again.",
    ],
  },
  {
    id: "sets", emoji: "📋", title: "Set checklists",
    body: [
      "Sets track your progress on a set or series, like the 1999 Pokémon Base Set or a year of Hot Wheels Mainline.",
      "- Go to **📋 Sets** on My collection, then **+ New set**. Paste the checklist with one line per piece, like \"4/102 Charizard\".",
      "- Tick lines off as you get them. **🔗 Match my items** ticks off lines that match items already in your collection: a line matches when every word appears in one of your items.",
      "- Filter by **All**, **Have** or **Missing**, and search long checklists.",
      "- Public sets show on your page under a **Sets** tab, so others can see what you're missing. Untick \"Show on my public page\" to keep a set private.",
    ],
  },
  {
    id: "goals", emoji: "🎯", title: "Goals and insights",
    body: [
      "**🎯 Goals** (on My collection): pick something to work toward, like finishing a set checklist, reaching 100 items, or 50 in one category. Give it a name if you like.",
      "- Progress fills in by itself as you add items and tick off set pieces. Items count when they're in your collection and not hidden.",
      "- Public goals show on your page under **Working toward**, and reaching one earns the 🎯 **Goal reached** badge. Untick \"Show on my public page\" to keep a goal to yourself. You can have up to 20.",
      "**📊 Insights** (members, on My collection): your collection's value and cost by category, your most valuable items, the biggest gainers, anything worth less than you paid, what you spent each year, and how many items you added each month. Free accounts see how many items they have in each category.",
    ],
  },
  {
    id: "shelves", emoji: "🗄️", title: "Shelves",
    body: [
      "Shelves are display cases for your page. Group your favorite items however you like, like an Earnhardt shelf, your PSA 10s or a holiday display. Unlike sets, a shelf only holds items you already have.",
      "- Go to **🗄️ Shelves** on My collection, name your shelf and create it.",
      "- On the shelf's page, search your collection and tick the items to add. Use **Remove from shelf** to take one off; it stays in your collection.",
      "- Public shelves show on your page under a **Shelves** tab. Untick \"Show on my public page\" to keep one private. Hidden items never show to others, even on a public shelf.",
      "- You can have up to 50 shelves with up to 200 items each, and an item can be on more than one shelf.",
    ],
  },
  {
    id: "selling", emoji: "🏷️", title: "Selling and wishlist alerts",
    body: [
      "Sales happen on eBay, so buyers and sellers keep eBay's protections.",
      "- **List an item for sale (members):** list it on eBay first, then edit the item, tick **Mark this item for sale** and paste the eBay listing link. Add an asking price if you like. It shows on the [For sale](/for-sale) page.",
      "- When it sells, set the item's status to **Sold** and enter what it sold for, so you can see your profit.",
      "- **Wishlist:** add things you're hunting for with **+ Wishlist** on My collection. When someone lists a matching item for sale, you get a 🎯 notification.",
    ],
  },
  {
    id: "trades", emoji: "🔁", title: "Trading",
    body: [
      "Trading is free for everyone. theCollectorHQ helps you find trades; you work out the details with the other collector.",
      "- **Mark items open to trade:** tick **🔁 Open to trade** on an item you own (or use Bulk edit for many at once). It gets a 🔁 Trade label and shows under an **Open to trade** tab on your page.",
      "- **Trade matches:** the [Trades](/trades) page shows items up for trade that match your wishlist, your trade items that are on other collectors' wishlists, and **two-way matches**, where you each have something the other wants. Matching works like wishlist alerts: same category, and every word of the wishlist name appears in the item's details.",
      "- **Alerts:** when someone marks an item open to trade that matches your wishlist, you get a 🔁 notification.",
      "- **Making the trade:** ask in the comments on the item. Agree on condition, photos and shipping before anything is sent, and keep to theCollectorHQ's rules: no phone numbers, emails or payment apps in comments.",
      "- Selling an item or moving it to your wishlist takes it off trade automatically.",
      "- **🤝 Trade reviews:** after a trade, open the other collector's page, choose the **Trade reviews** tab and leave a 👍 or 👎 with a few words. You can review someone once you've talked in the comments on either of your pages; you can change or remove your review later. Their page shows the totals, and 5 or more good reviews with hardly any bad ones earns the 🤝 **Trusted trader** badge. Use **Report** on a review that's false.",
      "- **🧩 Duplicates** (on My collection or Trades) finds things you have more than once: entries with the same name, category and grade, or a quantity over 1. One tap marks the extras open to trade.",
    ],
  },
  {
    id: "shows", emoji: "📅", title: "Card shows and swap meets",
    body: [
      "[Shows](/shows) is a calendar of upcoming card shows, toy shows, swap meets, conventions, auctions and collector meetups, posted by collectors.",
      "- **Find one:** filter by state, by what you collect, or by kind of event. Open an event for the dates, hours, address (with a map link), admission and the organizer's website.",
      "- **Going?** Tap **I'm going** so others know. Your page is listed under the event if it's public. Tick **Only ones I'm going to** to see your own plans.",
      "- **Post one:** tap **+ Post an event**, fill in the date, place and what you'll find there. You can edit it later, or tick **This event is cancelled** if it's called off.",
      "- **🎪 Show mode:** one phone-friendly page with your wishlist (with your target price as the most you'll pay), the pieces missing from your sets, and your trade bait with photos, plus your next show. Search it, tap **Got it!** to move a wishlist item into your collection, or print it. Open it once before you leave and it keeps working with no signal.",
      "- Events follow the same community rules as everything else: the website field is the place for a link, and descriptions can't include phone numbers or emails. Use **Report** on anything that looks fake.",
    ],
  },
  {
    id: "exploring", emoji: "🔍", title: "Exploring, search and following",
    body: [
      "- [Explore](/) shows the top-rated items first, with a Newest option and category buttons. [All categories](/categories) lists every category.",
      "- [Search](/search) finds items and collectors by name, set, player, brand, grade or tags. Every word has to match, and accents don't matter.",
      "- On a collector's page, use the search box, category menu and ★ Grails only to narrow their items, and the tabs for For sale, Wishlist, Sold and Sets.",
      "- [🏆 Leaderboards](/leaderboards) (linked from Explore): the top-rated items of the last 30 days, the most-followed collectors, and the fastest-growing collections. Only public collections count.",
      "- **Follow** collectors you like. [Following](/feed) shows what they add, and you'll get a notification when they add new items.",
    ],
  },
  {
    id: "community", emoji: "💬", title: "Ratings, saves, comments and notifications",
    body: [
      "- **Rate** other collectors' items from 1 to 5 stars on the item's page. Click your star again to take it back. Better-rated items rank higher on Explore.",
      "- **♡ Save** items you like to your private [Saved](/saved) list.",
      "- **Comment** on items and collections. Use **↩ Reply** to answer a comment directly, and **▲ ▼** to vote comments up or down. The best-voted conversations show first.",
      "- The **🔔 bell** at the top counts new notifications: comments and replies, new followers, ratings, new items from people you follow, wishlist matches, and notes from our team. Click it to see them all.",
      "- **Emails:** turn notification emails on or off in [Settings → Notifications](/settings#notifications).",
      "- **🤝 Invite friends** with your own link in [Settings](/settings#invite).",
    ],
  },
  {
    id: "badges", emoji: "🏅", title: "Badges",
    body: [
      "Badges show on your page under your name. They're earned automatically from what's on your public page, so hidden items and private details never count. Point at a badge to see what it's for.",
      "- 🌱 **Founding collector:** joined before theCollectorHQ officially launches. Yours for good.",
      "- 🧪 **Beta tester:** helps test new features.",
      "- 📦 **Item milestones:** 10, 50, 100, 250, 500 and 1,000 items in your collection.",
      "- ⭐ **Grail hunter:** feature one of your items as a grail.",
      "- 🏅 **Graded collection:** 5 or more graded or certified items.",
      "- 📋 **Set complete:** tick off every piece of a public set checklist with 5 or more pieces.",
      "- 🔥 **Crowd favorite:** an item rated 4.5 stars or more by at least 3 collectors.",
      "- 🧭 **Explorer:** items in 5 or more categories.",
      "- 🎯 **Goal reached:** reach one of the public goals you set.",
      "- 🤝 **Trusted trader:** 5 or more good trade reviews, and hardly any bad ones.",
      "- 👥 **Follower milestones:** 10, 50, 100, 250 and 1,000 followers.",
    ],
  },
  {
    id: "sharing", emoji: "📣", title: "Sharing your collection",
    body: [
      "Copy the link to your page or any item and paste it into Facebook, X, Instagram stories, a text or an email. It shows a preview card with the photo, name, grade, price if it's for sale, and your username.",
      "- Your page's card shows your profile picture, item count, followers, badges and up to 4 of your best items (grails first).",
      "- Only public details are ever shown. Hidden items and private collections show a plain theCollectorHQ card instead.",
      "- Facebook and others remember a preview for a while, so changes you make may take a day or so to show on links you already shared.",
    ],
  },
  {
    id: "safety", emoji: "🛡️", title: "Safety and community rules",
    body: [
      "To keep deals safe and the community friendly, public text can't include web links or website names, email addresses, phone numbers, payment apps (Venmo, Zelle, PayPal, Cash App and others), or profanity and slurs. If something's blocked, the message tells you which field and why.",
      "- Put links where they belong: the eBay listing field for items for sale, and your profile links in Settings.",
      "- **Report** anything that breaks the rules with the Report link on an item, comment or profile. Anything reported by 5 different people is hidden until our team reviews it.",
      "- **Block** someone from their page: they can't comment on your pages or follow you, and you won't see their comments. They aren't told. Manage blocked collectors in [Settings](/settings#blocked).",
      "- If our team removes one of your items or photos, you'll get a notification explaining why.",
    ],
  },
  {
    id: "plans", emoji: "⭐", title: "Free and member plans",
    body: [
      "- **Free:** up to 25 items, 1 photo per item, grading details, ratings, tags, wishlist, sets, shelves, follows, comments and search.",
      "- **Member:** unlimited items, up to 8 photos per item, what you paid and estimated values, gain or loss and profit, value history on each item, value over time, the collection report, and listing items for sale.",
      "Member features show a 🔒 on the free plan so you can see what's included. If a membership ends, everything already saved stays; you just can't add more of the member-only details. See your plan in [Settings](/settings#membership).",
    ],
  },
  {
    id: "account", emoji: "⚙️", title: "Your account and privacy",
    body: [
      "- **Privacy:** in [Settings](/settings), choose whether your collection is public, whether your page shows your email, location, values and follow lists, and who can comment.",
      "- **Your full name, what you paid and your gain or loss are always private.**",
      "- **Forgot your password?** Use the link on the [sign-in page](/login). Open the reset email in the same browser you asked from.",
      "- **🔐 Two-step sign-in:** in [Settings → Two-step sign-in](/settings#two-step), tap **Turn on**, scan the QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, Authy, 1Password and others), and enter the 6-digit code it shows. From then on, signing in asks for a fresh code from the app after your password, so nobody can get in with your password alone.",
      "- **Add a backup device** (a tablet or second phone) in the same place, so losing one phone doesn't lock you out. If you do lose access to every device, contact theCollectorHQ team: once we've confirmed it's you, we can turn two-step sign-in off so you can sign in with your password and set it up again.",
      "- **Delete your account** at the bottom of Settings. It permanently deletes everything.",
    ],
  },
  {
    id: "trouble", emoji: "🔧", title: "If something isn't working",
    body: [
      "If a page runs into a problem, you'll see a **Something went wrong on this page** message. Our team is told automatically, with the page you were on, so you don't need to report it.",
      "- Click **Try again**, or **Go to Explore** and try once more a little later.",
      "- If it keeps happening, beta testers can add details with the **💬 Feedback** button, or use the Report link if it's about someone's content.",
    ],
  },
  {
    id: "beta", emoji: "🧪", title: "Beta testers",
    body: [
      "Beta testers see a **💬 Feedback** button in the bottom-left corner of every page. Use it to report bugs and share ideas: it notes which page you were on so we can find the problem fast. Thank you for helping build theCollectorHQ!",
    ],
  },
];
