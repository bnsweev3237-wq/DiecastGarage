"use client";
import Link from "next/link";
import { useEffect } from "react";
import { sendError } from "@/components/ErrorReporter";

// Shown when a page crashes. The error is reported automatically.
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { sendError(error.message || "Page crashed", error.stack?.slice(0, 2000), error.digest); }, [error]);
  return (
    <main className="wrap" style={{ maxWidth: 640 }}>
      <div className="empty big">
        <span className="empty-emoji" aria-hidden="true">🔧</span>
        <h3>Something went wrong on this page</h3>
        <p>We&apos;ve been told about it automatically. Try again, and if it keeps happening, check back a little later.</p>
        <div className="actions"><button className="btn primary" type="button" onClick={reset}>Try again</button><Link className="btn" href="/">Go to Explore</Link></div>
      </div>
    </main>
  );
}
