"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; friendly_name?: string; status: string; created_at: string };
type Setup = { id: string; qr: string; secret: string };

// Supabase returns the QR code as "data:image/svg+xml;utf-8,<svg…>", which not every browser accepts.
// Rewrite it as a properly encoded SVG image.
export function qrSrc(raw: string) {
  let svg = raw.trim();
  // Peel off any "data:image/svg+xml…," prefixes (and percent-encoding) until the SVG itself is left.
  for (let i = 0; i < 3 && svg.startsWith("data:image/svg+xml"); i++) {
    const comma = svg.indexOf(",");
    if (comma < 0) return raw;
    svg = svg.slice(comma + 1);
    if (!svg.trimStart().startsWith("<")) { try { svg = decodeURIComponent(svg); } catch { return raw; } }
  }
  return svg.trimStart().startsWith("<svg") ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : raw;
}

// Settings → Two-step sign-in. Uses an authenticator app (Google Authenticator, Authy, 1Password and
// others). Once on, signing in asks for a 6-digit code after the password, and the database refuses a
// session without it (supabase/migrations/0036_two_step_signin.sql).
export default function TwoStepSettings() {
  const router = useRouter();
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await createClient().auth.mfa.listFactors();
    setFactors(((data?.all ?? []) as Factor[]).filter((f) => f.status === "verified"));
  }
  useEffect(() => { load(); }, []);

  async function start() {
    setBusy(true); setMsg({});
    const supabase = createClient();
    // Clear out any setup that was started but never finished.
    const { data } = await supabase.auth.mfa.listFactors();
    for (const f of (data?.all ?? []).filter((x) => x.status !== "verified")) await supabase.auth.mfa.unenroll({ factorId: f.id });
    const label = name.trim().slice(0, 40) || (factors?.length ? `Backup device ${factors.length + 1}` : "My phone");
    const { data: enrolled, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: label, issuer: "theCollectorHQ" });
    setBusy(false);
    if (error || !enrolled || enrolled.type !== "totp") return setMsg({ error: /friendly name/i.test(error?.message ?? "") ? "You already have a device with that name. Choose another name." : "Couldn't start the setup. Try again." });
    setSetup({ id: enrolled.id, qr: qrSrc(enrolled.totp.qr_code), secret: enrolled.totp.secret });
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!setup) return;
    const clean = code.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(clean)) return setMsg({ error: "Enter the 6-digit code your app shows." });
    setBusy(true); setMsg({});
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId: setup.id, code: clean });
    setBusy(false);
    if (error) return setMsg({ error: "That code didn't work. Check the app shows theCollectorHQ and use the newest code." });
    setSetup(null); setCode(""); setName("");
    setMsg({ ok: factors?.length ? "Backup device added." : "Two-step sign-in is on. You'll enter a code from your app each time you sign in." });
    await load();
    router.refresh();
  }

  async function remove(f: Factor) {
    const last = factors?.length === 1;
    if (!window.confirm(last ? "Turn off two-step sign-in? Signing in will only need your password." : `Remove “${f.friendly_name ?? "this device"}”?`)) return;
    setBusy(true); setMsg({});
    const { error } = await createClient().auth.mfa.unenroll({ factorId: f.id });
    setBusy(false);
    if (error) return setMsg({ error: "Couldn't change that. Sign out, sign back in with your code, and try again." });
    setMsg({ ok: last ? "Two-step sign-in is off." : "Device removed." });
    await load();
    router.refresh();
  }

  async function cancel() {
    if (setup) await createClient().auth.mfa.unenroll({ factorId: setup.id });
    setSetup(null); setCode(""); setMsg({});
  }

  const on = !!factors?.length;
  return (
    <section className="card" id="two-step">
      <div className="card-title"><h3>🔐 Two-step sign-in</h3>{factors && <span className={on ? "chip trade" : "chip"}>{on ? "On" : "Off"}</span>}</div>
      <p className="hint">
        Protect your account with a code from an authenticator app (like Google Authenticator, Microsoft Authenticator, Authy or 1Password) as well as your password.
        Even someone who learns your password can&apos;t get in without your phone.
      </p>
      {factors === null ? <p className="hint">Loading…</p> : <>
        {on && (
          <ul className="device-list">
            {factors!.map((f) => (
              <li key={f.id}><span>📱 <b>{f.friendly_name ?? "Authenticator app"}</b> <span className="hint">added {new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></span>
                <button className="linkbtn" type="button" onClick={() => remove(f)} disabled={busy}>{factors!.length === 1 ? "Turn off" : "Remove"}</button></li>
            ))}
          </ul>
        )}
        {!setup ? (
          <div className="actions">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={on ? "Name for the backup device" : "Name this device (optional)"} aria-label="Device name" className="text-input" style={{ maxWidth: 280 }} />
            <button className={on ? "btn" : "btn primary"} type="button" onClick={start} disabled={busy}>{busy ? "…" : on ? "+ Add a backup device" : "Turn on two-step sign-in"}</button>
          </div>
        ) : (
          <form className="two-step-setup" onSubmit={verify}>
            <ol>
              <li>Open your authenticator app and add an account by scanning this code:
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={setup.qr} alt="QR code to scan with your authenticator app" width={180} height={180} />
                <span className="hint">Can&apos;t scan it? Enter this key instead: <code className="secret">{setup.secret.replace(/(.{4})/g, "$1 ").trim()}</code></span></li>
              <li>Enter the 6-digit code the app shows for theCollectorHQ:
                <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={7} placeholder="123456" aria-label="6-digit code" className="text-input" style={{ fontSize: 22, letterSpacing: ".2em", maxWidth: 200 }} /></li>
            </ol>
            <div className="actions"><button className="btn primary" type="submit" disabled={busy}>{busy ? "Checking…" : "Confirm"}</button><button className="btn" type="button" onClick={cancel}>Cancel</button></div>
          </form>
        )}
        {on && <p className="hint">Tip: add a second device (a tablet or another phone) as a backup, in case you lose this one.</p>}
      </>}
      {msg.error && <p className="msg error" role="alert">{msg.error}</p>}
      {msg.ok && <p className="msg ok" role="status">{msg.ok}</p>}
    </section>
  );
}
