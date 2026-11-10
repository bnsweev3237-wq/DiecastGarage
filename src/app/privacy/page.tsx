import { notFound } from "next/navigation";
import { LEGAL_PAGES_LIVE, legalHtml } from "@/lib/legal";

export const metadata = { title: "Privacy Policy" };

export default function Page() {
  if (!LEGAL_PAGES_LIVE) notFound();
  // Our own file from /legal, not user content.
  return <main className="wrap legal" style={{ maxWidth: 760 }} dangerouslySetInnerHTML={{ __html: legalHtml("privacy-policy.md") }} />;
}
