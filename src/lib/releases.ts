// Release notes, newest first. Versions are 0.x until the first public release, 1.0.
// When you ship, add an entry here and set the same number as "version" in package.json.
export type Release = { version: string; date: string; title: string; changes: string[] };

export const releases: Release[] = [
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
