import Link from "next/link";
import type { Metadata } from "next";
import { CATEGORIES, CATEGORY_GROUPS, categoriesIn } from "@/lib/categories";

export const metadata: Metadata = { title: "All categories" };

export default function Categories() {
  return (
    <>
      <section className="band">
        <div className="band-in">
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 680 }}>
            <h1>All categories</h1>
            <p className="muted" style={{ margin: 0, fontSize: 18 }}>
              {CATEGORIES.length} ways to collect, including every Collectibles category on eBay. Pick one to see what collectors have added.
            </p>
          </div>
        </div>
      </section>
      <main className="wrap">
        {CATEGORY_GROUPS.map((g) => (
          <section key={g.key} className="catgroup" aria-label={g.label}>
            <div className="sec-head"><h2>{g.label}</h2></div>
            <div className="catgrid">
              {categoriesIn(g.key).map((c) => (
                <Link key={c.key} href={`/?category=${c.key}`} className="catcard">
                  <span className="cat-emoji">{c.emoji}</span>
                  <span>{c.label}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
