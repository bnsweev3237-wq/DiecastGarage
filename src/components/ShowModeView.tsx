"use client";
import { useState } from "react";
import Link from "next/link";
import Thumb from "./Thumb";
import SubmitButton from "./SubmitButton";
import { gotWishlistItem } from "@/app/actions";

export type ShowWish = { id: string; title: string; details: string; category: string; payUpTo: number | null; going: number | null };
export type ShowSet = { id: string; name: string; missing: string[]; total: number };
export type ShowTrade = { id: string; title: string; details: string; photo: string | null; value: number | null };

const money = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: n < 100 ? 2 : 0 })}`;

// The lists to take to a show. One search box narrows all three.
export default function ShowModeView({ wishes, sets, trades }: { wishes: ShowWish[]; sets: ShowSet[]; trades: ShowTrade[] }) {
  const [q, setQ] = useState("");
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hit = (...s: string[]) => { const t = s.join(" ").toLowerCase(); return words.every((w) => t.includes(w)); };
  const w = wishes.filter((x) => hit(x.title, x.details, x.category));
  const s = sets.map((x) => ({ ...x, missing: x.missing.filter((m) => hit(m, x.name)) })).filter((x) => x.missing.length);
  const t = trades.filter((x) => hit(x.title, x.details));
  const missingCount = sets.reduce((n, x) => n + x.missing.length, 0);
  return (
    <div className="show-mode">
      <input className="show-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search everything…" aria-label="Search your show lists" />

      <details open className="show-sec">
        <summary><h2>🎯 Wishlist <span className="hint">({wishes.length})</span></h2></summary>
        {w.length ? <ul className="show-list">{w.map((x) => (
          <li key={x.id}>
            <div><b>{x.title}</b>{x.details && <span className="hint">{x.details}</span>}</div>
            <div className="show-right">
              {x.payUpTo != null && <span className="show-price" title="Your target price">≤ {money(x.payUpTo)}</span>}
              {x.going != null && <span className="hint" title="Middle of the sold listings you logged">sells ~{money(x.going)}</span>}
              <form action={gotWishlistItem}><input type="hidden" name="id" value={x.id} /><SubmitButton className="btn small" pending="…">Got it!</SubmitButton></form>
            </div>
          </li>
        ))}</ul> : <p className="hint">{wishes.length ? "Nothing matches." : <>Your wishlist is empty. <Link href="/collection/new?status=wishlist">+ Add to your wishlist</Link></>}</p>}
      </details>

      <details open className="show-sec">
        <summary><h2>📋 Missing from my sets <span className="hint">({missingCount})</span></h2></summary>
        {s.length ? s.map((x) => (
          <div key={x.id} className="show-set">
            <h3><Link href={`/sets/${x.id}`}>{x.name}</Link> <span className="hint">missing {sets.find((y) => y.id === x.id)!.missing.length} of {x.total}</span></h3>
            <ul className="show-chips">{x.missing.map((m, i) => <li key={i}>{m}</li>)}</ul>
          </div>
        )) : <p className="hint">{missingCount ? "Nothing matches." : sets.length ? "Every set is complete. 🎉" : <>No set checklists yet. <Link href="/sets/new">+ New set</Link></>}</p>}
      </details>

      <details open className="show-sec">
        <summary><h2>🔁 My trade bait <span className="hint">({trades.length})</span></h2></summary>
        {t.length ? <ul className="show-list">{t.map((x) => (
          <li key={x.id}>
            {x.photo ? <Thumb className="pick-img" path={x.photo} /> : <span className="pick-img" />}
            <div><b>{x.title}</b>{x.details && <span className="hint">{x.details}</span>}</div>
            {x.value != null && <div className="show-right"><span className="hint">worth ~{money(x.value)}</span></div>}
          </li>
        ))}</ul> : <p className="hint">{trades.length ? "Nothing matches." : <>Nothing marked open to trade. Tick 🔁 Open to trade on items you&apos;d swap, or check your <Link href="/collection/duplicates">duplicates</Link>.</>}</p>}
      </details>
    </div>
  );
}
