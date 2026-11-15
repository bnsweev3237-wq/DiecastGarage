"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Cloudflare Turnstile: a free, mostly invisible check that a real person is signing up or in.
// Shown only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. Supabase checks the token itself once
// bot protection is turned on there (Authentication → Attack Protection), so set the key here first.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  getResponse: (id?: string) => string | undefined;
};
declare global { interface Window { turnstile?: TurnstileApi } }

export type TurnstileHandle = { token: () => string | undefined; reset: () => void };

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export default forwardRef<TurnstileHandle>(function Turnstile(_, ref) {
  const box = useRef<HTMLDivElement>(null);
  const id = useRef<string>();

  useImperativeHandle(ref, () => ({
    token: () => (id.current ? window.turnstile?.getResponse(id.current) : undefined),
    reset: () => { if (id.current) window.turnstile?.reset(id.current); },
  }));

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !box.current) return;
    const draw = () => {
      if (box.current && window.turnstile && !id.current)
        id.current = window.turnstile.render(box.current, { sitekey: TURNSTILE_SITE_KEY, theme: "auto", appearance: "interaction-only" });
    };
    if (window.turnstile) return draw();
    let s = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    if (!s) { s = document.createElement("script"); s.src = SCRIPT; s.async = true; document.head.appendChild(s); }
    s.addEventListener("load", draw);
    return () => s?.removeEventListener("load", draw);
  }, []);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={box} className="turnstile" />;
});
