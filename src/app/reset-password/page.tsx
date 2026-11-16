"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Opened from the reset email, already signed in by the link. Sets the new password.
export default function ResetPassword() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setReady(!!data.user));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== String(f.get("confirm"))) return setError("The two passwords don't match.");
    setBusy(true); setError("");
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(/different|same/i.test(error.message) ? "Choose a password you haven't used here before." : "Couldn't change your password. Try again.");
    router.push("/collection?password=changed");
    router.refresh();
  }

  if (ready === null) return <main className="wrap auth"><section className="card"><p className="hint">One moment…</p></section></main>;
  if (!ready) return (
    <main className="wrap auth"><section className="card">
      <h2>That link has expired</h2>
      <p>Reset links work once and expire after an hour. Ask for a new one and use the newest email.</p>
      <Link className="btn primary" href="/forgot-password">Send a new link</Link>
    </section></main>
  );

  return (
    <main className="wrap auth">
      <form className="card" onSubmit={onSubmit}>
        <h2>Choose a new password</h2>
        <div className="field"><label className="label" htmlFor="password">New password</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          <span className="hint">At least 8 characters</span></div>
        <div className="field"><label className="label" htmlFor="confirm">Type it again</label>
          <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" /></div>
        {error && <p className="msg error" role="alert">{error}</p>}
        <button className="btn primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save new password"}</button>
      </form>
    </main>
  );
}
