"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MAX_PHOTOS, THUMB_WIDTH, photoUrl, thumbPath } from "@/lib/items";
import Thumb from "./Thumb";
import { MembersBadge } from "./MembersOnly";

async function shrink(file: File, max = 1600, quality = 0.85): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", quality));
}

// Up to 8 photos, uploaded straight to storage under the user's own folder. The first one is the cover.
// The form saves the list of paths; photos removed here are deleted from storage when the item is saved.
// max: how many photos this account may keep (free accounts get 1; members get MAX_PHOTOS).
export default function PhotoInput({ userId, initial, title, max = MAX_PHOTOS }: { userId: string; initial: string[]; title: string; max?: number }) {
  const [paths, setPaths] = useState<string[]>(initial);
  const [status, setStatus] = useState("");
  const limit = Math.min(max, MAX_PHOTOS);
  const room = limit - paths.length;
  const locked = limit < MAX_PHOTOS;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])].slice(0, room);
    e.target.value = "";
    if (!files.length) return;
    setStatus(`Uploading ${files.length} photo${files.length > 1 ? "s" : ""}…`);
    const added: string[] = [];
    let failed = 0;
    for (const file of files) {
      try {
        const [blob, small] = await Promise.all([shrink(file), shrink(file, THUMB_WIDTH, 0.8)]);
        const next = `${userId}/${crypto.randomUUID()}.jpg`;
        const store = createClient().storage.from("car-photos");
        const { error } = await store.upload(next, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        // The small copy for cards and lists. If it fails, pages show the full photo instead.
        await store.upload(thumbPath(next), small, { contentType: "image/jpeg" });
        added.push(next);
        setPaths((p) => [...p, next]);
      } catch {
        failed++;
      }
    }
    setStatus(failed ? `Couldn't add ${failed} photo${failed > 1 ? "s" : ""}. Try JPEG or PNG.` : `${added.length} photo${added.length > 1 ? "s" : ""} ready. Save to keep ${added.length > 1 ? "them" : "it"}.`);
  }

  const makeCover = (i: number) => setPaths((p) => [p[i], ...p.filter((_, j) => j !== i)]);
  const remove = (i: number) => { setPaths((p) => p.filter((_, j) => j !== i)); setStatus("Photo removed. Save to confirm."); };
  const cover = photoUrl(paths[0] ?? null);

  return (
    <div className="field full photos-field">
      <input type="hidden" name="photos" value={JSON.stringify(paths)} />
      {cover ? <img className="photo" src={cover} alt={`Cover photo of ${title || "this item"}`} />
        : <label className="photo" htmlFor="photo">+ Add photos</label>}
      {paths.length > 0 && (
        <div className="thumbs" aria-label="All photos">
          {paths.map((p, i) => (
            <div key={p} className={i === 0 ? "thumb-edit cover" : "thumb-edit"}>
              <Thumb path={p} alt={`Photo ${i + 1}`} />
              {i === 0 ? <span className="cover-tag">Cover</span>
                : <button type="button" className="mini" onClick={() => makeCover(i)} aria-label={`Make photo ${i + 1} the cover`}>★</button>}
              <button type="button" className="mini x" onClick={() => remove(i)} aria-label={`Remove photo ${i + 1}`}>✕</button>
            </div>
          ))}
          {room > 0 && <label className="thumb-add" htmlFor="photo" aria-label="Add more photos">+</label>}
          {locked && room <= 0 && <span className="thumb-add thumb-locked" title="Members can add up to 8 photos">🔒</span>}
        </div>
      )}
      <div className="actions">
        {room > 0 && <label className="btn small" htmlFor="photo">{paths.length ? "Add more photos" : limit === 1 ? "Choose a photo" : "Choose photos"}</label>}
        <input id="photo" type="file" accept="image/*" multiple={limit > 1} hidden onChange={onPick} disabled={room <= 0} />
        <span className="hint" role="status">{status || (locked ? `${paths.length} of ${limit} photo${limit > 1 ? "s" : ""} on the free plan.` : `${paths.length} of ${MAX_PHOTOS}. Front, back, flaws and certificates help.`)}</span>
        {locked && <MembersBadge label="Up to 8 photos with a membership" />}
      </div>
    </div>
  );
}
