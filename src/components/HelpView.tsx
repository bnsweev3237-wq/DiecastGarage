"use client";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import type { HelpSection } from "@/lib/help";

// Turns **bold** and [text](/path) into formatting and links.
function rich(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((p, i) => {
    const bold = /^\*\*(.+)\*\*$/.exec(p);
    if (bold) return <b key={i}>{bold[1]}</b>;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p);
    if (link) return <Link key={i} href={link[2]}>{link[1]}</Link>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

function Body({ lines }: { lines: string[] }) {
  // Group consecutive "- " lines into one list.
  const blocks: (string | string[])[] = [];
  for (const l of lines) {
    if (l.startsWith("- ")) { const last = blocks[blocks.length - 1]; if (Array.isArray(last)) last.push(l.slice(2)); else blocks.push([l.slice(2)]); }
    else blocks.push(l);
  }
  return <>{blocks.map((b, i) => Array.isArray(b) ? <ul key={i}>{b.map((x, j) => <li key={j}>{rich(x)}</li>)}</ul> : <p key={i}>{rich(b)}</p>)}</>;
}

export default function HelpView({ sections }: { sections: HelpSection[] }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return sections;
    return sections.filter((s) => { const t = (s.title + " " + s.body.join(" ")).toLowerCase(); return words.every((w) => t.includes(w)); });
  }, [q, sections]);
  return (
    <div className="help">
      <input type="search" className="help-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help: photos, import, sell, password…" aria-label="Search help" />
      {!q && (
        <nav className="help-toc" aria-label="Help topics">
          {sections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.emoji} {s.title}</a>)}
        </nav>
      )}
      {shown.map((s) => (
        <section key={s.id} id={s.id} className="card help-section">
          <h2>{s.emoji} {s.title}</h2>
          <Body lines={s.body} />
        </section>
      ))}
      {!shown.length && <div className="empty"><h3>No help topics match</h3><p>Try a different word. Beta testers can also ask with the 💬 Feedback button.</p></div>}
    </div>
  );
}
