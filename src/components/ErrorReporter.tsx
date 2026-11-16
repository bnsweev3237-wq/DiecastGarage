"use client";
import { useEffect } from "react";

// Sends a browser error to /api/report-error. At most 5 per page load.
let sent = 0;
export function sendError(message: string, detail?: string, digest?: string) {
  if (sent >= 5 || typeof window === "undefined") return;
  sent++;
  const body = JSON.stringify({ message, detail, digest, path: window.location.pathname + window.location.search });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon("/api/report-error", new Blob([body], { type: "application/json" }));
    else fetch("/api/report-error", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch { /* ignore */ }
}

// Listens for errors anywhere on the page that nothing else caught.
export default function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => { if (e.message) sendError(e.message, `${e.filename ?? ""}:${e.lineno ?? ""}\n${e.error?.stack ?? ""}`.slice(0, 2000)); };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      sendError(`Unhandled: ${r instanceof Error ? r.message : String(r).slice(0, 200)}`, r instanceof Error ? r.stack?.slice(0, 2000) : undefined);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => { window.removeEventListener("error", onError); window.removeEventListener("unhandledrejection", onRejection); };
  }, []);
  return null;
}
