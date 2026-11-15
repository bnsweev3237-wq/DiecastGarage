// Keeps contact details and off-site deals out of public text: no web links or domain names, email
// addresses, phone numbers, or payment apps. Same rules as content_problem() in
// supabase/migrations/0015_content_rules.sql, which enforces them; this gives friendlier messages first.

export type ContentProblem = "link" | "email" | "phone" | "payment" | "language";

const RULES: [ContentProblem, RegExp][] = [
  ["email", /([a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}|\b[a-z0-9._%+-]+\s*(\(at\)|\[at\])\s*[a-z0-9-]+)/i],
  ["link", /(https?:\/\/|www\.|\b[a-z0-9-]+(\.[a-z0-9-]+)*\s?(\.|\[\.\]|\(\.\))\s?(com|net|org|io|co|us|info|biz|shop|store|me|ly|gg|tv|app|xyz|ca|uk|de|au|site|online|link|club|live|page|to|cc)\b|\b[a-z0-9-]+\s+dot\s+(com|net|org)\b)/i],
  ["phone", /(^|[^0-9])(\+?1[\s.-]?)?\(?[2-9][0-9]{2}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}([^0-9]|$)/],
  ["payment", /(\b(venmo|zelle|paypal|cash\s?app|apple\s?pay|google\s?pay|chime)\b|(^|\s)\$[a-z][a-z0-9_]{2,})/i],
  // Profanity and slurs. Kept narrow so names like Dick Trickle, Moby Dick or Hancock still pass.
  ["language", /(^|[^a-z])(f[u*@]+c?k+(s|ed|er|ers|ing|in|face|head|wit)?|motherf[u*@]+c?k[a-z]*|sh[i!1*]+t(s|ty|head|heads|bag|show)?|bullsh[i!1*]+t|c[u*]nts?|b[i!1*]tch(es|y)?|assholes?|dickheads?|wh[o0]res?|sluts?|twats?|wankers?|n[i!1*]gg(er|a|ers|as|uh)s?|f[a@]gg?(ot|ots|s)?|retard(s|ed)?|kikes?|spics?|wetbacks?|trann(y|ies)|gooks?|ragheads?)([^a-z]|$)/i],
];

export function contentProblem(text: string | null | undefined): ContentProblem | null {
  if (!text) return null;
  for (const [problem, re] of RULES) if (re.test(text)) return problem;
  return null;
}

const WHAT: Record<ContentProblem, string> = {
  link: "web links or website names",
  email: "email addresses",
  phone: "phone numbers",
  payment: "payment apps like Venmo, Zelle, PayPal or Cash App",
  language: "profanity or slurs",
};
const WHY: Record<ContentProblem, string> = {
  link: "Use the eBay listing field for sale links, and the profile links in Settings for your socials.",
  email: "Collectors can reach each other with comments, and your email can be shown from Settings → Privacy.",
  phone: "Keeping phone numbers off the site protects everyone from scams and spam.",
  payment: "Sales go through eBay, so buyers and sellers stay protected.",
  language: "Keep it friendly for collectors of every age.",
};

export const contentMessage = (problem: ContentProblem, field: string) =>
  `${field[0].toUpperCase()}${field.slice(1)} can't include ${WHAT[problem]}. ${WHY[problem]}`;

// Checks several labeled fields and returns a message for the first problem, or null if all are fine.
export function checkFields(fields: [label: string, value: string | null | undefined][]) {
  for (const [label, value] of fields) {
    const p = contentProblem(value);
    if (p) return contentMessage(p, label);
  }
  return null;
}

// Messages for the database's other safeguards (supabase/migrations/0016_moderation.sql).
const SAFEGUARDS: [string, string][] = [
  ["RATE_LIMIT_COMMENTS", "You're commenting very quickly. Take a short break and try again in a minute."],
  ["DUPLICATE_COMMENT", "You've already posted that same comment a couple of times today. Try writing something new."],
  ["RATE_LIMIT_ITEMS", "That's a lot of items in one hour. Take a short break, then keep going."],
  ["RATE_LIMIT_FOLLOWS", "You're following people very quickly. Try again in a little while."],
  ["RATE_LIMIT_REPORTS", "You've sent a lot of reports today. Thanks for looking out. Our team will review them."],
  ["BLOCKED", "You can't do that here."],
];
export const safeguardMessage = (message: string) => SAFEGUARDS.find(([code]) => message.includes(code))?.[1] ?? null;

// Turns the database's CONTENT_<PROBLEM>:<field> error into the same message.
export function contentDbMessage(message: string) {
  const m = /CONTENT_(LINK|EMAIL|PHONE|PAYMENT|LANGUAGE):(\w+)/.exec(message);
  return m ? contentMessage(m[1].toLowerCase() as ContentProblem, m[2] === "details" ? "the details" : m[2]) : safeguardMessage(message);
}
