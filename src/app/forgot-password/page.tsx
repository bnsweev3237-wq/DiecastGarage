"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Sends a password reset link. The link signs the collector in and opens /reset-password.
export default function ForgotPassword() {
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    setBusy(true); setError("");
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    // Say the same thing whether or not the email has an account, so nobody can use this to check.
    if (error && !/not found|no user/i.test(error.message)) return setError(/rate|seconds/i.test(error.message) ? "Please wait a minute before asking for another link." : "Couldn't send the link. Try again.");
    setSentTo(email);
  }

  return (
    <main className="wrap auth">
      {sentTo ? (
        <section className="card">
          <h2>Check your email</h2>
          <p>If <b>{sentTo}</b> has an account, we sent it a link to choose a new password. The link works once and expires after an hour.</p>
          <p className="hint">Nothing arrived? Check your spam folder, or <button className="linkbtn" type="button" onClick={() => setSentTo("")}>try again</button>.</p>
        </section>
      ) : (
        <form className="card" onSubmit={onSubmit}>
          <h2>Forgot your password?</h2>
          <p className="hint">Enter the email you signed up with and we&apos;ll send you a link to choose a new one.</p>
          <div className="field"><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
          {error && <p className="msg error" role="alert">{error}</p>}
          <button className="btn primary" type="submit" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
          <p className="hint"><Link href="/login">Back to sign in</Link></p>
        </form>
      )}
    </main>
  );
}
