// Every collectible belongs to one category. Each category adds its own fields on top of the common ones
// (name, brand/maker, year, condition, packaging, description, photo, price paid, value, for sale).
// Popular hobbies come first, then every Collectibles subcategory on eBay, then Other.
// Keys are stored on items; never rename one without a migration. The database only checks the key's shape
// (supabase/migrations/0007_more_categories.sql); the app keeps unknown keys out.

export type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  options?: string[]; // suggestions shown while typing; any value is allowed
  short?: boolean; // shown on item cards
};

export type Category = {
  key: string;
  label: string;
  emoji: string; // shown on category buttons and item stickers
  group: "popular" | "ebay" | "other";
  brandLabel: string; // what "brand" means for this hobby
  packagingLabel: string; // what "in original packaging" means for this hobby
  fields: FieldDef[];
};

const GRADERS_CARDS = ["Raw (ungraded)", "PSA", "BGS", "CGC", "SGC", "TAG"];

export const CATEGORIES: Category[] = [
  {
    key: "diecast", emoji: "🏎️", group: "popular", label: "Diecast & model vehicles", brandLabel: "Brand", packagingLabel: "Has the original box",
    fields: [
      { key: "scale", label: "Scale", placeholder: "1:24", options: ["1:64", "1:43", "1:32", "1:24", "1:18", "1:12", "1:87"], short: true },
      { key: "series", label: "Series or line", placeholder: "Hot Wheels Premium, Lionel Racing" },
      { key: "vehicle", label: "Vehicle", placeholder: "1969 Camaro, #3 Monte Carlo" },
    ],
  },
  {
    key: "cards", emoji: "🃏", group: "popular", label: "Trading cards", brandLabel: "Manufacturer", packagingLabel: "In a sleeve, toploader or slab",
    fields: [
      { key: "game", label: "Sport or game", placeholder: "Pokémon, Baseball", options: ["Pokémon", "Magic: The Gathering", "Yu-Gi-Oh!", "One Piece", "Lorcana", "Baseball", "Basketball", "Football", "Hockey", "Soccer"], short: true },
      { key: "set", label: "Set", placeholder: "Base Set, 2023 Topps Chrome", short: true },
      { key: "number", label: "Card number", placeholder: "4/102" },
      { key: "subject", label: "Player or character", placeholder: "Charizard, Shohei Ohtani" },
      { key: "grader", label: "Graded by", options: GRADERS_CARDS },
      { key: "grade", label: "Grade", placeholder: "10, 9.5", short: true },
    ],
  },
  {
    key: "coins", emoji: "🪙", group: "popular", label: "Coins & currency", brandLabel: "Mint", packagingLabel: "In original mint packaging",
    fields: [
      { key: "country", label: "Country", placeholder: "United States", short: true },
      { key: "denomination", label: "Denomination", placeholder: "Morgan dollar, $20 note", short: true },
      { key: "mint_mark", label: "Mint mark", placeholder: "CC, S, D" },
      { key: "grader", label: "Graded by", options: ["Raw (ungraded)", "PCGS", "NGC", "ANACS", "PMG"] },
      { key: "grade", label: "Grade", placeholder: "MS-65", short: true },
    ],
  },
  {
    key: "comics", emoji: "💥", group: "popular", label: "Comic books & memorabilia", brandLabel: "Publisher", packagingLabel: "Bagged and boarded",
    fields: [
      { key: "series", label: "Series", placeholder: "The Amazing Spider-Man", short: true },
      { key: "issue", label: "Issue", placeholder: "#300", short: true },
      { key: "variant", label: "Variant or printing", placeholder: "Newsstand, 2nd printing" },
      { key: "grader", label: "Graded by", options: ["Raw (ungraded)", "CGC", "CBCS", "PGX"] },
      { key: "grade", label: "Grade", placeholder: "9.8", short: true },
    ],
  },
  {
    key: "sneakers", emoji: "👟", group: "popular", label: "Sneakers", brandLabel: "Brand", packagingLabel: "Has the original box",
    fields: [
      { key: "model", label: "Model", placeholder: "Air Jordan 1 High", short: true },
      { key: "colorway", label: "Colorway", placeholder: "Chicago", short: true },
      { key: "size", label: "Size", placeholder: "US 10", short: true },
      { key: "sku", label: "Style code", placeholder: "DZ5485-612" },
    ],
  },
  {
    key: "toys", emoji: "🤖", group: "popular", label: "Toys & action figures", brandLabel: "Brand", packagingLabel: "Still in the package (MOC/MIB)",
    fields: [
      { key: "line", label: "Toy line", placeholder: "Star Wars Black Series", short: true },
      { key: "character", label: "Character", placeholder: "Boba Fett", short: true },
      { key: "wave", label: "Wave or series", placeholder: "Wave 3" },
    ],
  },
  {
    key: "lego", emoji: "🧱", group: "popular", label: "LEGO", brandLabel: "Brand", packagingLabel: "Sealed in the box",
    fields: [
      { key: "set_number", label: "Set number", placeholder: "75192", short: true },
      { key: "theme", label: "Theme", placeholder: "Star Wars, Technic", short: true },
      { key: "complete", label: "Complete?", options: ["Complete", "Complete with manual", "Missing pieces", "Built, no box"] },
    ],
  },
  {
    key: "funko", emoji: "🧸", group: "popular", label: "Funko Pop!", brandLabel: "Brand", packagingLabel: "In the original box",
    fields: [
      { key: "number", label: "Pop number", placeholder: "#01", short: true },
      { key: "series", label: "Series", placeholder: "Marvel, Star Wars", short: true },
      { key: "exclusive", label: "Exclusive or sticker", placeholder: "SDCC, Hot Topic, Chase" },
    ],
  },
  {
    key: "vinyl", emoji: "💿", group: "popular", label: "Vinyl records", brandLabel: "Label", packagingLabel: "Still sealed",
    fields: [
      { key: "artist", label: "Artist", placeholder: "The Beatles", short: true },
      { key: "format", label: "Format", options: ["LP", "12\" single", "7\" 45", "EP", "Box set"], short: true },
      { key: "pressing", label: "Pressing", placeholder: "1969 UK first press" },
      { key: "catalog", label: "Catalog number", placeholder: "PCS 7088" },
    ],
  },
  {
    key: "games", emoji: "🎮", group: "popular", label: "Video games", brandLabel: "Publisher", packagingLabel: "Still sealed",
    fields: [
      { key: "platform", label: "Platform", placeholder: "Nintendo 64", options: ["NES", "SNES", "Nintendo 64", "GameCube", "Game Boy", "Switch", "PlayStation", "PS2", "Xbox", "Sega Genesis"], short: true },
      { key: "region", label: "Region", options: ["NTSC (US)", "PAL (Europe)", "NTSC-J (Japan)"] },
      { key: "completeness", label: "Completeness", options: ["Loose", "Complete in box", "New / sealed"], short: true },
      { key: "grade", label: "Grade", placeholder: "WATA 9.4 A+" },
    ],
  },
  {
    key: "advertising", emoji: "📢", group: "ebay", label: "Advertising", brandLabel: "Brand advertised", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Sign, tin, thermometer, display", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "animals", emoji: "🐾", group: "ebay", label: "Animal collectibles", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "animal", label: "Animal", placeholder: "Horse, owl, dog breed", short: true },
      { key: "type", label: "Type", placeholder: "Figurine, plate, print", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "animation", emoji: "🎞️", group: "ebay", label: "Animation art & merchandise", brandLabel: "Studio", packagingLabel: "In original packaging",
    fields: [
      { key: "character", label: "Character", placeholder: "Mickey Mouse, Bugs Bunny", short: true },
      { key: "type", label: "Type", placeholder: "Production cel, figure, poster", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "arcade", emoji: "🕹️", group: "ebay", label: "Arcade, jukeboxes & pinball", brandLabel: "Manufacturer", packagingLabel: "In original packaging",
    fields: [
      { key: "title", label: "Machine or game", placeholder: "Addams Family pinball", short: true },
      { key: "type", label: "Type", placeholder: "Pinball, arcade cabinet, jukebox, parts", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "autographs", emoji: "🖊️", group: "ebay", label: "Autographs", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "signer", label: "Signed by", placeholder: "Babe Ruth, Taylor Swift", short: true },
      { key: "signed_item", label: "Signed item", placeholder: "Baseball, photo, guitar", short: true },
      { key: "authentication", label: "Authenticated by", placeholder: "PSA/DNA, JSA, Beckett", options: ["PSA/DNA", "JSA", "Beckett", "Fanatics", "Unauthenticated"] },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "banks", emoji: "🐷", group: "ebay", label: "Banks, registers & vending", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Mechanical bank, cash register, gumball machine", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "barware", emoji: "🍸", group: "ebay", label: "Barware", brandLabel: "Brand", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Decanter, shaker, glasses, bar sign", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "beads", emoji: "📿", group: "ebay", label: "Beads", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "material", label: "Material", placeholder: "Glass, trade beads, crystal", short: true },
      { key: "type", label: "Type", placeholder: "Loose, strand, lot", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "bottles", emoji: "🍾", group: "ebay", label: "Bottles & insulators", brandLabel: "Maker", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Soda, medicine, milk, insulator", short: true },
      { key: "color", label: "Color", placeholder: "Cobalt, aqua, amber", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "breweriana", emoji: "🍺", group: "ebay", label: "Breweriana & beer", brandLabel: "Brewery or brand", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Can, tap handle, sign, stein", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "casino", emoji: "🎰", group: "ebay", label: "Casino", brandLabel: "Casino", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Chip, dice, playing cards, sign", short: true },
      { key: "denomination", label: "Denomination", placeholder: "$5, $25", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "clocks", emoji: "🕰️", group: "ebay", label: "Clocks", brandLabel: "Maker", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Mantel, wall, cuckoo, alarm", short: true },
      { key: "movement", label: "Movement", placeholder: "Wind-up, electric, quartz", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "cultures", emoji: "🌍", group: "ebay", label: "Cultures & ethnicities", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "culture", label: "Culture or region", placeholder: "Native American, Asian, African", short: true },
      { key: "type", label: "Type", placeholder: "Basket, carving, textile", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "decorative", emoji: "🏺", group: "ebay", label: "Decorative collectibles", brandLabel: "Maker", packagingLabel: "In original packaging",
    fields: [
      { key: "line", label: "Line or series", placeholder: "Hummel, Lladró, Department 56", short: true },
      { key: "type", label: "Type", placeholder: "Figurine, plate, music box", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "disneyana", emoji: "🏰", group: "ebay", label: "Disneyana", brandLabel: "Maker", packagingLabel: "In original packaging",
    fields: [
      { key: "character", label: "Character or film", placeholder: "Mickey Mouse, The Little Mermaid", short: true },
      { key: "type", label: "Type", placeholder: "Pin, figure, park memorabilia", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "fantasy", emoji: "🐉", group: "ebay", label: "Fantasy, mythical & magic", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "theme", label: "Theme", placeholder: "Dragons, wizards, fairies", short: true },
      { key: "type", label: "Type", placeholder: "Figurine, sword, print", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "historical", emoji: "📜", group: "ebay", label: "Historical memorabilia", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "subject", label: "Event or person", placeholder: "Civil War, Apollo 11, presidential", short: true },
      { key: "type", label: "Type", placeholder: "Document, button, medal, photo", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "holiday", emoji: "🎄", group: "ebay", label: "Holiday & seasonal", brandLabel: "Maker", packagingLabel: "In original packaging",
    fields: [
      { key: "holiday", label: "Holiday", placeholder: "Christmas, Halloween, Easter", options: ["Christmas", "Halloween", "Easter", "Thanksgiving", "Valentine's Day", "Fourth of July", "St. Patrick's Day"], short: true },
      { key: "type", label: "Type", placeholder: "Ornament, blow mold, decoration", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "kitchen", emoji: "🍳", group: "ebay", label: "Kitchen & home", brandLabel: "Maker", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Cookie jar, Pyrex, cast iron, canisters", short: true },
      { key: "pattern", label: "Pattern", placeholder: "Butterprint, Fire-King Jadeite", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "knives", emoji: "🗡️", group: "ebay", label: "Knives, swords & blades", brandLabel: "Maker", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Pocket knife, fixed blade, sword", short: true },
      { key: "model", label: "Model or pattern", placeholder: "Case XX Trapper", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "lamps", emoji: "💡", group: "ebay", label: "Lamps & lighting", brandLabel: "Maker", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Table lamp, lantern, oil lamp, neon", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "textiles", emoji: "🧵", group: "ebay", label: "Linens & textiles", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Quilt, tablecloth, handkerchief, feedsack", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "metalware", emoji: "🥄", group: "ebay", label: "Metalware", brandLabel: "Maker", packagingLabel: "In original packaging",
    fields: [
      { key: "metal", label: "Metal", placeholder: "Brass, copper, pewter, cast iron", short: true },
      { key: "type", label: "Type", placeholder: "Tray, candlestick, figurine", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "militaria", emoji: "🎖️", group: "ebay", label: "Militaria", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "conflict", label: "War or era", placeholder: "WWII, Vietnam, Civil War", options: ["Civil War", "WWI", "WWII", "Korea", "Vietnam", "Cold War", "Modern"], short: true },
      { key: "branch", label: "Branch or country", placeholder: "US Army, Royal Navy", short: true },
      { key: "type", label: "Type", placeholder: "Medal, helmet, patch, uniform" },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "nonsport_cards", emoji: "🎴", group: "ebay", label: "Non-sport trading cards", brandLabel: "Manufacturer", packagingLabel: "In original packaging",
    fields: [
      { key: "set", label: "Set", placeholder: "1966 Topps Batman, Garbage Pail Kids", short: true },
      { key: "number", label: "Card number", placeholder: "#1", short: true },
      { key: "subject", label: "Subject", placeholder: "Batman, Star Wars" },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "paper", emoji: "📄", group: "ebay", label: "Paper & ephemera", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Ticket, menu, map, magazine, poster", short: true },
      { key: "subject", label: "Subject", placeholder: "Railroad, theater, World's Fair", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "pens", emoji: "✒️", group: "ebay", label: "Pens & writing instruments", brandLabel: "Maker", packagingLabel: "In original packaging",
    fields: [
      { key: "model", label: "Model", placeholder: "Montblanc Meisterstück 149, Parker 51", short: true },
      { key: "type", label: "Type", placeholder: "Fountain pen, ballpoint, pencil, inkwell", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "pez", emoji: "🔑", group: "ebay", label: "Pez, keychains & promo glasses", brandLabel: "Brand", packagingLabel: "In original packaging",
    fields: [
      { key: "character", label: "Character or promo", placeholder: "Santa Pez, McDonald's glass", short: true },
      { key: "type", label: "Type", placeholder: "Pez dispenser, keychain, glass", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "photos", emoji: "📷", group: "ebay", label: "Photographic images", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Tintype, cabinet card, snapshot, slide", short: true },
      { key: "subject", label: "Subject", placeholder: "Portrait, town view, celebrity", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "pinbacks", emoji: "📌", group: "ebay", label: "Pinbacks, bobbleheads & lunchboxes", brandLabel: "Maker", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Pinback button, bobblehead, lunchbox", short: true },
      { key: "subject", label: "Subject", placeholder: "Political, team, TV show", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "postcards", emoji: "📮", group: "ebay", label: "Postcards", brandLabel: "Publisher", packagingLabel: "In original packaging",
    fields: [
      { key: "location", label: "Place or topic", placeholder: "Route 66, Chicago, holiday", short: true },
      { key: "type", label: "Type", placeholder: "Real photo, linen, chrome", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "radio_tv", emoji: "📻", group: "ebay", label: "Radio, phonograph, TV & phone", brandLabel: "Maker", packagingLabel: "In original packaging",
    fields: [
      { key: "model", label: "Model", placeholder: "Zenith Trans-Oceanic", short: true },
      { key: "type", label: "Type", placeholder: "Radio, phonograph, television, telephone", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "religion", emoji: "🕊️", group: "ebay", label: "Religion & spirituality", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "faith", label: "Faith or tradition", placeholder: "Christian, Buddhist, Jewish", short: true },
      { key: "type", label: "Type", placeholder: "Icon, rosary, statue, book", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "rocks", emoji: "🪨", group: "ebay", label: "Rocks, fossils & minerals", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "specimen", label: "Specimen", placeholder: "Amethyst geode, trilobite, meteorite", short: true },
      { key: "locality", label: "Where it was found", placeholder: "Morocco, Arkansas", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "science", emoji: "🔬", group: "ebay", label: "Science & medicine", brandLabel: "Maker", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Microscope, medical instrument, apothecary", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "scifi", emoji: "👽", group: "ebay", label: "Science fiction & horror", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "franchise", label: "Franchise", placeholder: "Star Trek, Star Wars, Universal Monsters", short: true },
      { key: "type", label: "Type", placeholder: "Prop replica, figure, poster", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "sewing", emoji: "🪡", group: "ebay", label: "Sewing", brandLabel: "Maker", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Thimble, sewing machine, buttons, pattern", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "souvenirs", emoji: "🧳", group: "ebay", label: "Souvenirs & travel memorabilia", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "place", label: "Place or event", placeholder: "Niagara Falls, 1939 World's Fair", short: true },
      { key: "type", label: "Type", placeholder: "Spoon, plate, pennant, snow globe", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "tobacciana", emoji: "🚬", group: "ebay", label: "Tobacciana", brandLabel: "Brand", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Lighter, pipe, tin, ashtray, humidor", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "tools", emoji: "🔧", group: "ebay", label: "Tools, hardware & locks", brandLabel: "Maker", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Plane, wrench, padlock, key", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "transportation", emoji: "🚂", group: "ebay", label: "Transportation", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "mode", label: "Railroad, aviation, auto or ship", placeholder: "Railroadiana, aviation, automobilia", short: true },
      { key: "type", label: "Type", placeholder: "Lantern, sign, timetable, emblem", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "vanity", emoji: "🪞", group: "ebay", label: "Vanity, perfume & shaving", brandLabel: "Brand", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Perfume bottle, compact, razor, mirror", short: true },
      { key: "era", label: "Era or decade", placeholder: "1950s", short: true },
    ],
  },
  {
    key: "vintage_retro", emoji: "📺", group: "ebay", label: "Vintage, retro & mid-century", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [
      { key: "type", label: "Type", placeholder: "Atomic decor, lava lamp, barware", short: true },
      { key: "decade", label: "Decade", placeholder: "1950s, 1960s, 1970s", short: true },
    ],
  },
  {
    key: "other", emoji: "⭐", group: "other", label: "Other", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [{ key: "type", label: "What kind of collectible", placeholder: "Stamps, watches, movie props", short: true }],
  },
];

export const CATEGORY_GROUPS: { key: Category["group"]; label: string }[] = [
  { key: "popular", label: "Popular" },
  { key: "ebay", label: "More collectibles" },
  { key: "other", label: "Something else" },
];
export const categoriesIn = (group: Category["group"]) => CATEGORIES.filter((c) => c.group === group);

export const CONDITIONS: [string, string][] = [
  ["sealed", "New / sealed"], ["mint", "Mint"], ["near_mint", "Near mint"], ["excellent", "Excellent"],
  ["good", "Good"], ["fair", "Fair"], ["poor", "Poor"],
];

export const categoryOf = (key: string | null | undefined) => CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
export const conditionLabel = (key: string | null | undefined) => CONDITIONS.find(([k]) => k === key)?.[1] ?? null;

// Short "Pokémon · Base Set · 9" style summary for cards and lists.
export function summary(item: { category: string; brand: string | null; year: string | null; attributes: Record<string, unknown> | null }) {
  const cat = categoryOf(item.category);
  const attrs = item.attributes ?? {};
  const bits = [item.brand, ...cat.fields.filter((f) => f.short).map((f) => attrs[f.key]), item.year]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  return [...new Set(bits)].slice(0, 4).join(" · ");
}

// Keeps only this category's fields, as short trimmed strings.
export function cleanAttributes(category: string, read: (key: string) => string) {
  const out: Record<string, string> = {};
  for (const f of categoryOf(category).fields) {
    const v = read(f.key).trim().slice(0, 100);
    if (v) out[f.key] = v;
  }
  return out;
}
