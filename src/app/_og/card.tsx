import { ImageResponse } from "next/og";
import { publicDb } from "@/lib/supabase/public";

// Share cards: the picture Facebook, X, iMessage and others show when someone shares a link.
// 1200x630, navy and apricot like the site. Only public information is used: the database is read
// signed out, so hidden items, private collections and anything under review fall back to the plain card.
// No emoji here: the image renderer would fetch emoji pictures from a CDN on every render.

export const SIZE = { width: 1200, height: 630 };
const NAVY = "#1f2b45";
const APRICOT = "#f0915a";
const PEACH = "#fde4d4";
const MUTED = "#c3cadb";

export { publicDb };

async function assets() {
  const [bold, heavy, logo] = await Promise.all([
    fetch(new URL("./jakarta-700.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("./jakarta-800.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("./logo.png", import.meta.url)).then((r) => r.arrayBuffer()),
  ]);
  return { fonts: [{ name: "Jakarta", data: bold, weight: 700 as const }, { name: "Jakarta", data: heavy, weight: 800 as const }], logo };
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

function Frame({ logo, children }: { logo: ArrayBuffer; children: React.ReactNode }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: NAVY, color: "#fff", fontFamily: "Jakarta",
      backgroundImage: "radial-gradient(circle at 90% 0%, rgba(240,145,90,.35), transparent 55%), radial-gradient(circle at 0% 100%, rgba(92,122,180,.35), transparent 55%)" }}>
      <div style={{ display: "flex", flex: 1, padding: "44px 52px 0", gap: 44 }}>{children}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 52px", background: "#fbfaf8" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={logo as unknown as string} width={260} height={68} />
        <span style={{ fontSize: 24, fontWeight: 700, color: NAVY }}>Catalog · Value · Show off every collection</span>
      </div>
    </div>
  );
}

const Chip = ({ text, strong }: { text: string; strong?: boolean }) => (
  <span style={{ display: "flex", padding: "8px 16px", borderRadius: 999, fontSize: 24, fontWeight: 700,
    background: strong ? APRICOT : "rgba(255,255,255,.12)", color: strong ? NAVY : "#fff" }}>{text}</span>
);

export async function itemCard(item: {
  title: string; photo: string | null; category: string; details: string; chips: string[]; price: string | null; username: string;
} | null) {
  const { fonts, logo } = await assets();
  if (!item) return plainCard(fonts, logo);
  return new ImageResponse(
    <Frame logo={logo}>
      <div style={{ display: "flex", width: 470, height: 470, borderRadius: 28, overflow: "hidden", background: PEACH, flex: "none", alignItems: "center", justifyContent: "center" }}>
        {item.photo
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          ? <img src={item.photo} width={470} height={470} style={{ objectFit: "cover" }} />
          : <span style={{ fontSize: 120, fontWeight: 800, color: APRICOT }}>{item.title[0]?.toUpperCase()}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 18, paddingTop: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: APRICOT }}>{item.category}</span>
        <span style={{ fontSize: item.title.length > 48 ? 46 : 58, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1 }}>{clip(item.title, 90)}</span>
        {item.details && <span style={{ fontSize: 28, color: MUTED }}>{clip(item.details, 70)}</span>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {item.price && <Chip text={item.price} strong />}
          {item.chips.map((c) => <Chip key={c} text={c} />)}
        </div>
        <span style={{ marginTop: "auto", marginBottom: 30, fontSize: 30, fontWeight: 700 }}>@{item.username}</span>
      </div>
    </Frame>,
    { ...SIZE, fonts },
  );
}

export async function profileCard(p: {
  username: string; avatar: string | null; items: number; followers: number; photos: string[]; badges: string[];
} | null) {
  const { fonts, logo } = await assets();
  if (!p) return plainCard(fonts, logo);
  const tiles = p.photos.slice(0, 4);
  return new ImageResponse(
    <Frame logo={logo}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 20, paddingTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {p.avatar
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            ? <img src={p.avatar} width={110} height={110} style={{ borderRadius: 28, objectFit: "cover" }} />
            : <span style={{ display: "flex", width: 110, height: 110, borderRadius: 28, background: APRICOT, color: NAVY, fontSize: 60, fontWeight: 800, alignItems: "center", justifyContent: "center" }}>{p.username[0]?.toUpperCase()}</span>}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: -1 }}>@{clip(p.username, 20)}</span>
            <span style={{ fontSize: 28, color: MUTED }}>{p.items.toLocaleString("en-US")} items · {p.followers.toLocaleString("en-US")} followers</span>
          </div>
        </div>
        <span style={{ fontSize: 34, fontWeight: 700, color: PEACH }}>Check out my collection on theCollectorHQ</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>{p.badges.slice(0, 4).map((b) => <Chip key={b} text={b} />)}</div>
      </div>
      {!!tiles.length && (
        <div style={{ display: "flex", flexWrap: "wrap", width: 470, gap: 14, flex: "none", alignContent: "flex-start" }}>
          {tiles.map((src) => (
            <div key={src} style={{ display: "flex", width: tiles.length === 1 ? 470 : 228, height: tiles.length === 1 ? 470 : 228, borderRadius: 22, overflow: "hidden", background: PEACH }}>
              {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
              <img src={src} width={tiles.length === 1 ? 470 : 228} height={tiles.length === 1 ? 470 : 228} style={{ objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}
    </Frame>,
    { ...SIZE, fonts },
  );
}

function plainCard(fonts: Awaited<ReturnType<typeof assets>>["fonts"], logo: ArrayBuffer) {
  return new ImageResponse(
    <Frame logo={logo}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
        <span style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1.02 }}>Show off</span>
        <span style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1.02, color: APRICOT }}>what you collect.</span>
        <span style={{ fontSize: 30, color: MUTED }}>Catalog every piece, track its value, and follow other collectors.</span>
      </div>
    </Frame>,
    { ...SIZE, fonts },
  );
}
