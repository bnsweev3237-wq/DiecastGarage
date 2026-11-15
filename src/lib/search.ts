// Turns what someone typed into lowercase, accent-free words, the same way items' search_text is built
// (supabase/migrations/0013_search.sql). Every word has to match.
export function searchWords(q: string | undefined | null) {
  return (q ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[%_\\,()"']/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
}

// For filtering lists already loaded on the page, like My collection.
export const matchesAll = (words: string[], ...fields: unknown[]) => {
  if (!words.length) return true;
  const hay = fields
    .flatMap((f) => (Array.isArray(f) ? f : f && typeof f === "object" ? Object.values(f) : [f]))
    .filter((x) => x != null && x !== "")
    .join(" ")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  return words.every((w) => hay.includes(w));
};
