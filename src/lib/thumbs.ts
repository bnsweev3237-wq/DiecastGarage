import "server-only";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { THUMB_WIDTH, thumbPath } from "@/lib/items";

// Makes the small copy for item photos that don't have one yet (photos from before thumbnails,
// or uploads whose small copy failed). Stops early when time runs short so the request doesn't time out.
export async function makeMissingThumbs(db: ReturnType<typeof createAdminClient>, { limit = 60, budgetMs = 40_000 } = {}) {
  const started = Date.now();
  const { data, error } = await db.rpc("photos_missing_thumbs", { p_limit: limit });
  if (error) throw new Error(error.message);
  const names = ((data ?? []) as { name: string }[]).map((r) => r.name);
  let made = 0, failed = 0;
  for (const name of names) {
    if (Date.now() - started > budgetMs) break;
    try {
      const { data: file, error: e1 } = await db.storage.from("car-photos").download(name);
      if (e1 || !file) throw e1 ?? new Error("missing");
      const small = await sharp(Buffer.from(await file.arrayBuffer()))
        .rotate()
        .resize({ width: THUMB_WIDTH, height: THUMB_WIDTH, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
      const { error: e2 } = await db.storage.from("car-photos").upload(thumbPath(name), small, { contentType: "image/jpeg", upsert: true });
      if (e2) throw e2;
      made++;
    } catch {
      failed++;
    }
  }
  return { made, failed, waiting: names.length - made - failed };
}
