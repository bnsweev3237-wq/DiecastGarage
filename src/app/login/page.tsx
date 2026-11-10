"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/garage";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError("");
    const { error } = await createClient().auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
    setBusy(false);
    if (error) return setError(error.message === "Invalid login credentials" ? "That email and password don't match." : error.message);
    router.push(next);
    router.refresh();
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>Sign in</h2>
      <div className="field"><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
      <div className="field"><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" /></div>
      {error && <p className="msg error" role="alert">{error}</p>}
      <button className="btn primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      <p className="hint">New here? <Link href="/signup">Create a free account</Link></p>
    </form>
  );
}

export default function Login() {
  return <main className="wrap auth"><Suspense><LoginForm /></Suspense></main>;
}
