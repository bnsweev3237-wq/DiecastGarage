"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MAX_PHOTOS, photoUrl } from "@/lib/items";

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
export default function PhotoInput({ userId, initial, title }: { userId: string; initial: string[]; title: string }) {
  const [paths, setPaths] = useState<string[]>(initial);
  const [status, setStatus] = useState("");
  const room = MAX_PHOTOS - paths.length;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])].slice(0, room);
    e.target.value = "";
    if (!files.length) return;
    setStatus(`Uploading ${files.length} photo${files.length > 1 ? "s" : ""}…`);
    const added: string[] = [];
    let failed = 0;
    for (const file of files) {
      try {
        const blob = await shrink(file);
        const next = `${userId}/${crypto.randomUUID()}.jpg`;
        const { error } = await createClient().storage.from("car-photos").upload(next, blob, { contentType: "image/jpeg" });
        if (error) throw error;
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
              <img src={photoUrl(p)!} alt={`Photo ${i + 1}`} />
              {i === 0 ? <span className="cover-tag">Cover</span>
                : <button type="button" className="mini" onClick={() => makeCover(i)} aria-label={`Make photo ${i + 1} the cover`}>★</button>}
              <button type="button" className="mini x" onClick={() => remove(i)} aria-label={`Remove photo ${i + 1}`}>✕</button>
            </div>
          ))}
          {room > 0 && <label className="thumb-add" htmlFor="photo" aria-label="Add more photos">+</label>}
        </div>
      )}
      <div className="actions">
        <label className="btn small" htmlFor="photo">{paths.length ? "Add more photos" : "Choose photos"}</label>
        <input id="photo" type="file" accept="image/*" multiple hidden onChange={onPick} disabled={room <= 0} />
        <span className="hint" role="status">{status || `${paths.length} of ${MAX_PHOTOS}. Front, back, flaws and certificates help.`}</span>
      </div>
    </div>
  );
}
