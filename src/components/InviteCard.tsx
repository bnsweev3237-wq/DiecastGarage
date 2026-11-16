"use client";
import { useState } from "react";

// Your personal invite link. Friends who sign up with it are credited to you.
export default function InviteCard({ username, joined }: { username: string; joined: number }) {
  const [copied, setCopied] = useState(false);
  const link = `${typeof window === "undefined" ? "https://thecollectorhq.com" : window.location.origin}/signup?ref=${username}`;
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* the link is shown to copy by hand */ }
  }
  async function share() {
    if (navigator.share) { try { await navigator.share({ title: "Join me on theCollectorHQ", text: "Catalog and show off your collection with me on theCollectorHQ.", url: link }); } catch { /* cancelled */ } }
    else copy();
  }
  return (
    <section className="card" id="invite">
      <h3>🤝 Invite friends</h3>
      <p className="hint">Share your link with fellow collectors. When they sign up with it, they&apos;re counted as your invite.</p>
      <div className="invite-row">
        <input readOnly value={link} aria-label="Your invite link" onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn small" onClick={copy}>{copied ? "Copied ✓" : "Copy link"}</button>
        <button type="button" className="btn small primary" onClick={share}>Share</button>
      </div>
      <p className="hint">{joined ? `🎉 ${joined} friend${joined === 1 ? " has" : "s have"} joined with your link.` : "Nobody has joined with your link yet."}</p>
    </section>
  );
}
