"use client";
import { useEffect, useState } from "react";

// Chrome and Edge fire this when the site can be installed with one tap.
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "chq-install-dismissed";
const DISMISS_DAYS = 30;

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
function isIos() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function useInstall() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(true); // assume installed until checked, so nothing flashes
  const [ios, setIos] = useState(false);
  useEffect(() => {
    setInstalled(isInstalled());
    setIos(isIos());
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as InstallEvent); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }
  return { canPrompt: !!deferred, ios, installed, install };
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "-3px" }}>
      <path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

// A small card at the bottom of the screen, shown until the app is installed or dismissed.
export function InstallBanner() {
  const { canPrompt, ios, installed, install } = useInstall();
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
      setDismissed(Date.now() - at < DISMISS_DAYS * 864e5);
    } catch { setDismissed(false); }
  }, []);
  function dismiss() {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode: just hide for now */ }
  }
  if (installed || dismissed || (!canPrompt && !ios)) return null;
  return (
    <aside className="install-banner" aria-label="Install the app">
      <img src="/icons/icon-192.png" width="44" height="44" alt="" />
      <div className="install-text">
        <b>Get the CollectorHQ app</b>
        {canPrompt ? <span>Add it to your home screen for one-tap access to your collection.</span>
          : <span>Tap <ShareIcon /> Share, then <b>Add to Home Screen</b>.</span>}
      </div>
      {canPrompt && <button className="btn primary small" type="button" onClick={install}>Install</button>}
      <button className="linkbtn" type="button" onClick={dismiss} aria-label="Not now">✕</button>
    </aside>
  );
}

// The always-available version, for Settings.
export function InstallSection() {
  const { canPrompt, ios, installed, install } = useInstall();
  return (
    <section className="card" id="app">
      <h3>Get the app</h3>
      {installed ? (
        <p className="hint">You&apos;re using the installed app. It updates automatically.</p>
      ) : canPrompt ? (
        <>
          <p className="hint">Install theCollectorHQ on this device for one-tap access from your home screen or desktop.</p>
          <div><button className="btn primary" type="button" onClick={install}>Install the app</button></div>
        </>
      ) : ios ? (
        <p className="hint">On iPhone or iPad, open this site in <b>Safari</b>, tap <ShareIcon /> <b>Share</b>, then <b>Add to Home Screen</b>.</p>
      ) : (
        <p className="hint">On Android, open the browser menu (⋮) and tap <b>Install app</b> or <b>Add to Home screen</b>. On a computer, use Chrome or Edge and click the install icon in the address bar.</p>
      )}
    </section>
  );
}

// Registers the service worker that shows a friendly page when there's no connection.
export function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => { /* the site works without it */ });
    }
  }, []);
  return null;
}
