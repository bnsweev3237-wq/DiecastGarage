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
