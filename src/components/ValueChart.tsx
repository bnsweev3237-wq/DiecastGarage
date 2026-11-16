import { money } from "@/lib/items";

type Point = { day: string; value: number; cost: number };

// A simple line chart of collection value (orange) and cost (grey) over time, drawn as SVG.
export default function ValueChart({ points }: { points: Point[] }) {
  if (points.length < 2) return (
    <section className="card value-chart">
      <div className="card-title"><h3>📈 Value over time</h3></div>
      <p className="hint">Your chart starts today. We record your collection&apos;s value once a day, so check back tomorrow to see the line begin.</p>
    </section>
  );
  const W = 760, H = 200, P = { l: 56, r: 12, t: 12, b: 26 };
  const t0 = Date.parse(points[0].day), t1 = Date.parse(points[points.length - 1].day);
  const max = Math.max(...points.flatMap((p) => [p.value, p.cost]), 1) * 1.08;
  const x = (d: string) => P.l + ((Date.parse(d) - t0) / Math.max(t1 - t0, 1)) * (W - P.l - P.r);
  const y = (v: number) => H - P.b - (v / max) * (H - P.t - P.b);
  const line = (k: "value" | "cost") => points.map((p, i) => `${i ? "L" : "M"}${x(p.day).toFixed(1)},${y(p[k]).toFixed(1)}`).join(" ");
  const first = points[0], last = points[points.length - 1];
  const change = last.value - first.value;
  const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const ticks = [0, 0.5, 1].map((f) => max * f / 1.08);
  return (
    <section className="card value-chart">
      <div className="card-title">
        <h3>📈 Value over time</h3>
        <span className={change >= 0 ? "pill up" : "pill down"}>{change >= 0 ? "+" : "−"}{money(Math.abs(change))} since {fmt(first.day)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Collection value went from ${money(first.value)} on ${fmt(first.day)} to ${money(last.value)} on ${fmt(last.day)}`}>
        {ticks.map((v) => <g key={v}><line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} className="grid" /><text x={P.l - 8} y={y(v) + 4} textAnchor="end" className="axis">{money(v)}</text></g>)}
        <text x={P.l} y={H - 6} className="axis">{fmt(first.day)}</text>
        <text x={W - P.r} y={H - 6} textAnchor="end" className="axis">{fmt(last.day)}</text>
        <path d={line("cost")} className="cost-line" />
        <path d={`${line("value")} L${x(last.day)},${H - P.b} L${x(first.day)},${H - P.b} Z`} className="value-area" />
        <path d={line("value")} className="value-line" />
        <circle cx={x(last.day)} cy={y(last.value)} r="5" className="value-dot" />
      </svg>
      <p className="hint"><span className="key value" /> Estimated value {money(last.value)} · <span className="key cost" /> Cost {money(last.cost)} · Recorded once a day.</p>
    </section>
  );
}
