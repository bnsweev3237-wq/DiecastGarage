import type { Metadata } from "next";
import Link from "next/link";
import HelpView from "@/components/HelpView";
import { HELP } from "@/lib/help";
import { currentVersion } from "@/lib/releases";

export const metadata: Metadata = { title: "Help", description: "How to use theCollectorHQ: adding items, values, import, sets, selling, safety and more." };

export default function Help() {
  return (
    <main className="wrap" style={{ maxWidth: 860 }}>
      <div className="head"><div><h1>Help</h1>
        <p>How to use theCollectorHQ. Up to date for version {currentVersion}. See what&apos;s new in the <Link href="/release-notes">release notes</Link>.</p></div></div>
      <HelpView sections={HELP} />
    </main>
  );
}
