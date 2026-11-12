"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { photoUrl } from "@/lib/items";

async function shrink(file: File, max = 1600, quality = 0.85): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", quality));
}

// Uploads straight to storage under the user's own folder; the form saves the path.
export default function PhotoInput({ userId, initial, title }: { userId: string; initial: string | null; title: string }) {
  const [path, setPath] = useState(initial);
  const [status, setStatus] = useState("");
  const src = photoUrl(path);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("Uploading photo…");
    try {
      const blob = await shrink(file);
      const next = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error } = await createClient().storage.from("car-photos").upload(next, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      setPath(next);
      setStatus("Photo ready. Save to keep it.");
    } catch {
      setStatus("Couldn't add that photo. Try a JPEG or PNG.");
    }
    e.target.value = "";
  }

  return (
    <div className="field full">
      <input type="hidden" name="photo_path" value={path ?? ""} />
      {src ? <img className="photo" src={src} alt={`Photo of ${title || "this item"}`} />
        : <label className="photo" htmlFor="photo">+ Add a photo</label>}
      <div className="actions">
        <label className="btn small" htmlFor="photo">{src ? "Replace photo" : "Choose photo"}</label>
        <input id="photo" type="file" accept="image/*" hidden onChange={onPick} />
        {src && <button className="btn small" type="button" onClick={() => { setPath(null); setStatus("Photo removed. Save to confirm."); }}>Remove photo</button>}
        <span className="hint" role="status">{status}</span>
      </div>
    </div>
  );
}
