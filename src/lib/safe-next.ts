// Where to send someone after they sign in. Only pages on this site are allowed: "//evil.com",
// "/\evil.com" and paths with hidden characters would take them to another site (an open redirect),
// which scammers use to make a fake sign-in page look like it came from us.
export function safeNext(value: string | null | undefined, fallback = "/collection"): string {
  return value && /^\/(?![/\\])[^\\\x00-\x20\x7f]*$/.test(value) ? value : fallback;
}
