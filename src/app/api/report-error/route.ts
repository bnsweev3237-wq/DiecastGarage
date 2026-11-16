import { NextResponse } from "next/server";
import { reportError } from "@/lib/report-error";
import { getUser } from "@/lib/supabase/server";

// Browsers report crashes here (from the error pages and the page-wide error listener).
// Kept small and capped so it can't be used to flood the log.
const recent = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (hits.length >= 10) return NextResponse.json({ ok: false }, { status: 429 });
  recent.set(ip, [...hits, now]);
  if (recent.size > 5000) recent.clear();

  let body: { message?: unknown; detail?: unknown; path?: unknown; digest?: unknown } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const message = typeof body.message === "string" ? body.message.slice(0, 300) : "";
  if (!message) return NextResponse.json({ ok: false }, { status: 400 });
  // Ignore noise from browser extensions and network blips that aren't the site's fault.
  if (/ResizeObserver loop|chrome-extension:|moz-extension:|Failed to fetch|Load failed|NetworkError|cancelled/i.test(message))
    return NextResponse.json({ ok: true });
  const { user } = await getUser();
  await reportError({
    source: "browser", message,
    detail: [typeof body.digest === "string" ? `digest ${body.digest}` : "", typeof body.detail === "string" ? body.detail.slice(0, 2000) : "", (req.headers.get("user-agent") ?? "").slice(0, 200)].filter(Boolean).join("\n"),
    path: typeof body.path === "string" ? body.path.slice(0, 300) : null, userId: user?.id ?? null,
  });
  return NextResponse.json({ ok: true });
}
