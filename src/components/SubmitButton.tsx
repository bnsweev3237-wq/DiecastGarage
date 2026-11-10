"use client";
import { useFormStatus } from "react-dom";

export default function SubmitButton({ children, className = "btn primary", pending = "Saving…" }:
  { children: React.ReactNode; className?: string; pending?: string }) {
  const { pending: busy } = useFormStatus();
  return <button className={className} type="submit" disabled={busy}>{busy ? pending : children}</button>;
}
