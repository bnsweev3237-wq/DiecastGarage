"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FREE_CAR_LIMIT } from "@/lib/limits";
import { LEGAL_PAGES_LIVE, TERMS_VERSION } from "@/lib/legal-flags";

export default function SignUp() {
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const username = String(f.get("username")).trim().toLowerCase();
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return setError("Usernames are 3–20 letters, numbers or underscores.");
    setBusy(true); setError("");
    const supabase = createClient();
    const { data: taken } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
    if (taken) { setBusy(false); return setError(`@${username} is taken. Try another.`); }
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { username, full_name: String(f.get("full_name")).trim() || null, ...(LEGAL_PAGES_LIVE ? { terms_version: TERMS_VERSION } : {}) },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/garage`,
      },
    });
    setBusy(false);
    if (error) return setError(error.message);
    setSentTo(email);
  }

  if (sentTo) return (
    <main className="wrap auth"><section className="card">
      <h2>Check your email</h2>
      <p>We sent a link to <b>{sentTo}</b>. Open it to confirm your account and start your garage.</p>
    </section></main>
  );

  return (
    <main className="wrap auth">
      <form className="card" onSubmit={onSubmit}>
        <h2>Join Racasto</h2>
        <p className="hint">Free for up to {FREE_CAR_LIMIT} cars. Become a member any time for an unlimited garage.</p>
        <div className="field"><label className="label" htmlFor="full_name">Full name</label><input id="full_name" name="full_name" maxLength={100} autoComplete="name" />
          <span className="hint">Private. Only you see it.</span></div>
        <div className="field"><label className="label" htmlFor="username">Username</label><input id="username" name="username" required minLength={3} maxLength={20} autoComplete="username" placeholder="pitroad_pete" />
          <span className="hint">This is how other collectors see you. Your page will be at /c/username</span></div>
        <div className="field"><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
        <div className="field"><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          <span className="hint">At least 8 characters</span></div>
        {LEGAL_PAGES_LIVE && (
          <label className="check" htmlFor="agree"><input id="agree" name="agree" type="checkbox" required />
            <span>I&apos;m 13 or older and agree to the <Link href="/terms" target="_blank">Terms of Service</Link> and <Link href="/privacy" target="_blank">Privacy Policy</Link></span></label>
        )}
        {error && <p className="msg error" role="alert">{error}</p>}
        <button className="btn primary" type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
        <p className="hint">Already a member? <Link href="/login">Sign in</Link></p>
      </form>
    </main>
  );
}
