import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Runs once a day (see vercel.json). Deletes photos that were uploaded over a day ago but never
// saved to an item or profile. Vercel sends the CRON_SECRET it's configured with; anyone else is turned away.
export const dynamic = "force-dynamic";

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
  console.log("photo cleanup", deleted);
  return NextResponse.json({ deleted });
}
