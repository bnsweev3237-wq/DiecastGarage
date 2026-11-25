"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/client";

// The second step of signing in, for collectors who turned on two-step sign-in in Settings. The
// database refuses everything until this is done (supabase/migrations/0036_two_step_signin.sql).
function CodeForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "").replace(/\s+/g, "");
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from your authenticator app.");
    setBusy(true); setError("");
    const supabase = createClient();
    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) { setBusy(false); return setError("Your sign-in has expired. Sign in again."); }
    // Try each authenticator app on the account (someone may have added a backup device).
    let ok = false;
    for (const f of factors?.totp ?? []) {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: f.id, code });
      if (!error) { ok = true; break; }
    }
    setBusy(false);
    if (!ok) return setError("That code didn't work. Codes change every 30 seconds, so use the newest one.");
    router.push(next);
    router.refresh();
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>🔐 Enter your code</h2>
      <p className="hint">Open your authenticator app and enter the 6-digit code for theCollectorHQ.</p>
      <div className="field"><label className="label" htmlFor="code">Code</label>
        <input id="code" name="code" required autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} placeholder="123456" style={{ fontSize: 24, letterSpacing: ".2em", textAlign: "center" }} /></div>
      {error && <p className="msg error" role="alert">{error}</p>}
      <button className="btn primary" type="submit" disabled={busy}>{busy ? "Checking…" : "Continue"}</button>
      <p className="hint">Lost your phone? <Link href="/help#account">See Help</Link> for how to get back in.</p>
    </form>
  );
}

export default function TwoStep() {
  return (
    <main className="wrap auth">
      <Suspense><CodeForm /></Suspense>
      <form action="/auth/signout" method="post"><button className="linkbtn" type="submit">Sign out instead</button></form>
    </main>
  );
}
