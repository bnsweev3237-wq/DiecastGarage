import { releases } from "@/lib/releases";

export const metadata = { title: "Release notes" };

export default function ReleaseNotes() {
  return (
    <main className="wrap" style={{ maxWidth: 760 }}>
      <div className="head">
        <div>
          <h1>Release notes</h1>
          <p>What&apos;s new at The Collectors Association. Versions start at 0.x during testing; 1.0 is the first public release.</p>
        </div>
      </div>
      {releases.map((r) => (
        <section className="card" key={r.version} id={`v${r.version}`}>
          <div className="card-title">
            <h2>{r.version} · {r.title}</h2>
            <span className="hint num">{new Date(r.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          </div>
          <ul className="changes">{r.changes.map((c) => <li key={c}>{c}</li>)}</ul>
        </section>
      ))}
    </main>
  );
}
