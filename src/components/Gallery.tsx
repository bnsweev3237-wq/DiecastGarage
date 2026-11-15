"use client";
import { useState } from "react";
import { photoUrl } from "@/lib/items";
import ItemPlaceholder from "./ItemPlaceholder";
import Thumb from "./Thumb";

// The item page's photos: a big one with thumbnails to switch between them.
export default function Gallery({ paths, title }: { paths: string[]; title: string }) {
  const [i, setI] = useState(0);
  if (!paths.length)
    return <div className="photo" style={{ display: "grid", placeItems: "center", color: "var(--muted)" }} title="No photo yet"><ItemPlaceholder width={240} /></div>;
  const current = photoUrl(paths[Math.min(i, paths.length - 1)])!;
  return (
    <div className="gallery-view">
      <a href={current} target="_blank" rel="noopener noreferrer" aria-label="Open the full-size photo">
        <img className="photo" src={current} alt={`Photo ${i + 1} of ${paths.length}: ${title}`} />
      </a>
      {paths.length > 1 && (
        <div className="thumbs">
          {paths.map((p, j) => (
            <button key={p} type="button" className={j === i ? "on" : undefined} onClick={() => setI(j)} aria-label={`Show photo ${j + 1}`}>
              <Thumb path={p} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
