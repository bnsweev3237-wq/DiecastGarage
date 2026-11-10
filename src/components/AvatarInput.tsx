"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { avatarUrl } from "@/lib/cars";

// Center-crops to a square so every profile picture lines up the same way.
async function squareCrop(file: File, size = 400): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(size, side);
  canvas.getContext("2d")!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.88));
}

export default function AvatarInput({ userId, initial, username }: { userId: string; initial: string | null; username: string }) {
  const [path, setPath] = useState(initial);
  const [status, setStatus] = useState("");
  const src = avatarUrl(path);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("Uploading…");
    try {
      const next = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error } = await createClient().storage.from("avatars").upload(next, await squareCrop(file), { contentType: "image/jpeg" });
      if (error) throw error;
      setPath(next);
      setStatus("Picture ready. Save to keep it.");
    } catch {
      setStatus("Couldn't add that picture. Try a JPEG or PNG.");
    }
    e.target.value = "";
  }

  return (
    <div className="field">
      <span className="label">Profile picture</span>
      <input type="hidden" name="avatar_path" value={path ?? ""} />
      <div className="car">
        {src ? <img className="avatar" src={src} alt="" /> : <span className="avatar" aria-hidden="true">{username.slice(0, 1)}</span>}
        <div className="actions">
          <label className="btn small" htmlFor="avatar">{src ? "Change picture" : "Add a picture"}</label>
          <input id="avatar" type="file" accept="image/*" hidden onChange={onPick} />
          {src && <button className="btn small" type="button" onClick={() => { setPath(null); setStatus("Picture removed. Save to confirm."); }}>Remove</button>}
        </div>
      </div>
      <span className="hint" role="status">{status || "Shown on your public page and next to your comments."}</span>
    </div>
  );
}
