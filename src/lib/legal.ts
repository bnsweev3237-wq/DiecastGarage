import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { marked } from "marked";

export { LEGAL_PAGES_LIVE, TERMS_VERSION } from "./legal-flags";

// The Terms and Privacy Policy are written in /legal as Markdown and shown as pages.
export function legalHtml(file: "terms-of-service.md" | "privacy-policy.md") {
  const md = readFileSync(path.join(process.cwd(), "legal", file), "utf8");
  return marked.parse(md, { async: false }) as string;
}
