"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import Turnstile, { TURNSTILE_SITE_KEY, type TurnstileHandle } from "@/components/Turnstile";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/collection";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const human = useRef<TurnstileHandle>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const captchaToken = human.current?.token();
    if (TURNSTILE_SITE_KEY && !captchaToken) return setError("Please wait a moment while we check you're not a bot, then try again.");
    setBusy(true); setError("");
    const { error } = await createClient().auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")), options: { captchaToken } });
    setBusy(false);
    human.current?.reset(); // each check works once
    if (error) return setError(error.message === "Invalid login credentials" ? "That email and password don't match."
      : /captcha/i.test(error.message) ? "We couldn't confirm you're not a bot. Try again." : error.message);
    router.push(next);
    router.refresh();
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>Sign in</h2>
      <div className="field"><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
      <div className="field"><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" />
        <Link className="hint" href="/forgot-password" style={{ alignSelf: "flex-end" }}>Forgot your password?</Link></div>
      {error && <p className="msg error" role="alert">{error}</p>}
      <Turnstile ref={human} />
      <button className="btn primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      <p className="hint">New here? <Link href="/signup">Create a free account</Link></p>
    </form>
  );
}

export default function Login() {
  return <main className="wrap auth"><Suspense><LoginForm /></Suspense></main>;
}
