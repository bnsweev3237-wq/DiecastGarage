// Keep in sync with the reason check on reports in supabase/migrations/0005_reports_and_terms.sql.
export const REPORT_REASONS = [
  ["spam", "Spam"],
  ["harassment", "Harassment or bullying"],
  ["hate", "Hate speech"],
  ["sexual", "Sexual or violent content"],
  ["scam", "Scam or fraud"],
  ["misrepresented", "Misrepresented item (fake, custom or reproduction passed off as original)"],
  ["copyright", "Uses my photo or copyrighted content"],
  ["private_info", "Shares someone's private information"],
  ["other", "Something else"],
] as const;

export type ReportTarget = "item" | "comment" | "profile";
export const reasonLabel = (r: string) => REPORT_REASONS.find(([k]) => k === r)?.[1] ?? r;

// Why the team removed something, written for the collector who owns it. Sent in their notification.
export const REMOVAL_REASONS = [
  ["misrepresented", "It appeared to misrepresent the item, for example a reproduction, custom or fake listed as an original."],
  ["copyright", "The photo appeared to belong to someone else or to use copyrighted content."],
  ["unrelated_photo", "The photo didn't show the item."],
  ["contact", "It included contact details or tried to arrange a sale outside eBay."],
  ["spam", "It looked like spam or advertising."],
  ["scam", "It looked like a scam or fraud."],
  ["sexual", "It contained sexual or violent content."],
  ["hate", "It contained hate speech."],
  ["harassment", "It targeted or harassed someone."],
  ["private_info", "It shared someone's private information."],
  ["other", "It broke our community rules."],
] as const;
export const removalText = (r: string) => REMOVAL_REASONS.find(([k]) => k === r)?.[1] ?? "It broke our community rules.";
