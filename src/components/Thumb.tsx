"use client";
import { useEffect, useRef, useState } from "react";
import { photoUrl, thumbUrl } from "@/lib/items";

// Shows a photo's small copy, and the full photo if the small one doesn't exist yet.
export default function Thumb({ path, className, alt = "" }: { path: string; className?: string; alt?: string }) {
  const [full, setFull] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // The small copy can fail before the page finishes loading, when onError isn't listening yet. Check once here too.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFull(true);
  }, []);
  return (
    <img ref={ref} className={className} src={(full ? photoUrl(path) : thumbUrl(path))!} alt={alt}
      loading="lazy" decoding="async" onError={() => setFull(true)} />
  );
}
