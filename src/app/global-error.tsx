"use client";
import { useEffect } from "react";
import { sendError } from "@/components/ErrorReporter";

// Last-resort error page if the whole site layout fails. Plain HTML, since the layout didn't load.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { sendError(`Site layout crashed: ${error.message}`, error.stack?.slice(0, 2000), error.digest); }, [error]);
  return (
    <html lang="en"><body style={{ fontFamily: "system-ui, sans-serif", padding: 40, textAlign: "center" }}>
      <h1>theCollectorHQ hit a problem</h1>
      <p>We&apos;ve been told about it automatically. Please try again in a moment.</p>
      <button type="button" onClick={reset} style={{ padding: "10px 20px", borderRadius: 999, border: 0, background: "#fe7101", fontWeight: 700 }}>Try again</button>
    </body></html>
  );
}
