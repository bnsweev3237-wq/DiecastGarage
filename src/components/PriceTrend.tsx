import { money } from "@/lib/items";
import { monthLabel, monthlyMedians, trend, type Sale } from "@/lib/price-trend";

// Value history for one item: each dated sold listing as a dot, and the middle price per month as a line.
export default function PriceTrend({ sales }: { sales: Sale[] }) {
  const dated = sales.filter((s) => s.sold_on);
  const points = monthlyMedians(sales);
  if (dated.length < 2) return (
    <p className="hint">📉 Log at least 2 sold listings with a date to see how this item&apos;s price has moved.</p>
  );
  const W = 520, H = 170, P = { l: 52, r: 10, t: 10, b: 24 };
  const days = dated.map((s) => Date.parse(s.sold_on!));
  const t0 = Math.min(...days), t1 = Math.max(...days);
  const prices = dated.map((s) => Number(s.price));
  const max = Math.max(...prices, 1) * 1.1;
  const x = (t: number) => P.l + ((t - t0) / Math.max(t1 - t0, 1)) * (W - P.l - P.r);
  const y = (v: number) => H - P.b - (v / max) * (H - P.t - P.b);
  const mid = (m: string) => Date.parse(`${m}-15T12:00:00Z`);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(Math.min(Math.max(mid(p.month), t0), t1)).toFixed(1)},${y(p.median).toFixed(1)}`).join(" ");
  const t = trend(points);
  const day = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  return (
    <div className="trend">
      <div className="card-title">
        <h3 style={{ fontSize: 17 }}>📈 Value history</h3>
        {t && <span className={t.pct >= 0 ? "pill up" : "pill down"}>{t.pct >= 0 ? "Up" : "Down"} {Math.abs(t.pct)}% since {monthLabel(t.from.month)}</span>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={t ? `Monthly middle price went from ${money(t.from.median)} in ${monthLabel(t.from.month)} to ${money(t.to.median)} in ${monthLabel(t.to.month)}` : `${dated.length} sold listings`}>
        {[0, 0.5, 1].map((f) => { const v = (max / 1.1) * f; return <g key={f}><line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} className="grid" /><text x={P.l - 6} y={y(v) + 4} textAnchor="end" className="axis">{money(v)}</text></g>; })}
        <text x={P.l} y={H - 6} className="axis">{day(t0)}</text>
        <text x={W - P.r} y={H - 6} textAnchor="end" className="axis">{day(t1)}</text>
        {dated.map((s, i) => <circle key={i} cx={x(Date.parse(s.sold_on!))} cy={y(Number(s.price))} r="5" className="dot"><title>{`${money(Number(s.price), 2)} on ${s.sold_on}`}</title></circle>)}
        {points.length > 1 && <path d={line} className="median" />}
      </svg>
      <p className="hint">Dots are sold listings you logged; the line is the middle price each month.{sales.length > dated.length ? ` ${sales.length - dated.length} without a date aren't shown.` : ""}</p>
    </div>
  );
}
