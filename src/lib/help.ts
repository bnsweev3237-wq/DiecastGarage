// The Help page (/help). Plain-language directions for every part of theCollectorHQ.
//
// KEEP THIS UP TO DATE: every release that adds or changes something people use must update the
// matching section here, then set HELP_UPDATED_FOR to that release's version. The build checks it
// (scripts/check-help.mjs) and fails if the newest version in src/lib/releases.ts is newer than this.
//
// Writing format: each section has paragraphs. A line starting with "- " is a bullet.
// **bold** and [link text](/path) work inside any line.

export const HELP_UPDATED_FOR = "0.35";

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
      "- **Condition, box or packaging, quantity, and edition or serial number.**",
      "- **Graded or COA:** tick the box to add who graded or certified it, the grade and the cert number. PSA, PCGS, NGC and CGC numbers get a Verify link others can use.",
      "- **My rating** (1 to 5 stars) is your own opinion of the item. **Feature it** marks it as one of your grails, shown first on your page.",
      "- **Tags** are your own labels, separated by commas, like Earnhardt, PC, Trade bait.",
      "- **Description** and **Provenance and history** for anything worth knowing.",
      "- **Hide this item** keeps it off your public page; only you will see it.",
      "Tip: on any of your items, **＋ Add another like this** starts a new item with the same details filled in. Change what's different, add photos and save.",
      "After you click **Save changes**, you go back to My collection with a note saying what was saved.",
    ],
  },
  {
    id: "my-collection", emoji: "🗂️", title: "My collection",
    body: [
      "[My collection](/collection) lists everything you've added, with tabs for **Collection**, **Wishlist** and **Sold**.",
      "- **Search** your items, including private details like where they're stored.",
      "- **Filter** by category, by tag (the Filter by tag dropdown) or **★ Grails only**.",
      "- **Sort** by grails first, last modified, recently added, oldest, name, or highest value.",
      "- The **Box** column shows a ✓ for items with their original box or packaging.",
      "- Members see totals for cost, estimated value and gain or loss at the top, and a **Value over time** chart.",
      "Other tools at the top of the page: **📋 Sets**, **♥ Saved**, **Bulk edit**, **Import** and **Export**.",
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
      "- **📈 Value over time** on My collection records your collection's value once a day.",
      "- **🛡️ Collection report:** from the link under the chart, open a printable list of everything you own with photos, grading, cost and value. Use **Print or save as PDF** for insurance or your records.",
    ],
  },
  {
    id: "bulk-import", emoji: "📥", title: "Bulk edit, import and export",
    body: [
      "**Bulk edit** (on My collection): tick items, then add or remove tags, move them to a category, set where they're stored, hide or show them, or mark them boxed, all at once. Anything you leave empty stays as it is.",
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
    id: "selling", emoji: "🏷️", title: "Selling and wishlist alerts",
    body: [
      "Sales happen on eBay, so buyers and sellers keep eBay's protections.",
      "- **List an item for sale (members):** list it on eBay first, then edit the item, tick **Mark this item for sale** and paste the eBay listing link. Add an asking price if you like. It shows on the [For sale](/for-sale) page.",
      "- When it sells, set the item's status to **Sold** and enter what it sold for, so you can see your profit.",
      "- **Wishlist:** add things you're hunting for with **+ Wishlist** on My collection. When someone lists a matching item for sale, you get a 🎯 notification.",
    ],
  },
  {
    id: "exploring", emoji: "🔍", title: "Exploring, search and following",
    body: [
      "- [Explore](/) shows the top-rated items first, with a Newest option and category buttons. [All categories](/categories) lists every category.",
      "- [Search](/search) finds items and collectors by name, set, player, brand, grade or tags. Every word has to match, and accents don't matter.",
      "- On a collector's page, use the search box, category menu and ★ Grails only to narrow their items, and the tabs for For sale, Wishlist, Sold and Sets.",
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
      "- **Free:** up to 25 items, 1 photo per item, grading details, ratings, tags, wishlist, sets, follows, comments and search.",
      "- **Member:** unlimited items, up to 8 photos per item, what you paid and estimated values, gain or loss and profit, value over time, the collection report, and listing items for sale.",
      "Member features show a 🔒 on the free plan so you can see what's included. If a membership ends, everything already saved stays; you just can't add more of the member-only details. See your plan in [Settings](/settings#membership).",
    ],
  },
  {
    id: "account", emoji: "⚙️", title: "Your account and privacy",
    body: [
      "- **Privacy:** in [Settings](/settings), choose whether your collection is public, whether your page shows your email, location, values and follow lists, and who can comment.",
      "- **Your full name, what you paid and your gain or loss are always private.**",
      "- **Forgot your password?** Use the link on the [sign-in page](/login). Open the reset email in the same browser you asked from.",
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
