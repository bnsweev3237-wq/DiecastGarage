import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { makeMissingThumbs } from "@/lib/thumbs";

// Runs once a day (see vercel.json). Deletes photos that were uploaded over a day ago but never
// saved to an item or profile, then makes small copies for photos that don't have one yet.
// Vercel sends the CRON_SECRET it's configured with; anyone else is turned away.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db.rpc("orphan_photos", { p_min_age: "1 day", p_limit: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byBucket = new Map<string, string[]>();
  for (const row of (data ?? []) as { bucket: string; name: string }[])
    byBucket.set(row.bucket, [...(byBucket.get(row.bucket) ?? []), row.name]);

  const deleted: Record<string, number> = {};
  for (const [bucket, names] of byBucket) {
    for (let i = 0; i < names.length; i += 100) {
      const { data: gone, error: e } = await db.storage.from(bucket).remove(names.slice(i, i + 100));
      if (e) return NextResponse.json({ error: e.message, deleted }, { status: 500 });
      deleted[bucket] = (deleted[bucket] ?? 0) + (gone?.length ?? 0);
    }
  }
  // Record each member's collection value for the Value over time chart.
  const { data: snapshots } = await db.rpc("take_collection_snapshots");
  let thumbs: Awaited<ReturnType<typeof makeMissingThumbs>> | { error: string };
  try { thumbs = await makeMissingThumbs(db, { limit: 80, budgetMs: 40_000 }); }
  catch (e) { thumbs = { error: e instanceof Error ? e.message : "failed" }; }
  console.log("daily job", { deleted, thumbs, snapshots });
  return NextResponse.json({ deleted, thumbs, snapshots });
}
