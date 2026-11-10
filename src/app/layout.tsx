import type { Metadata } from "next";
import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import { getUser } from "@/lib/supabase/server";
import { currentVersion } from "@/lib/releases";
import { LEGAL_PAGES_LIVE } from "@/lib/legal-flags";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Diecast Garage", template: "%s · Diecast Garage" },
  description: "Show off your race car diecast collection, follow other collectors, and value your cars from real sold listings.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getUser();
  const [{ data: me }, { data: isAdmin }] = user
    ? await Promise.all([
        supabase.from("profiles").select("username").eq("id", user.id).single(),
        supabase.rpc("is_admin"),
      ])
    : [{ data: null }, { data: false }];
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@1,700;1,800;1,900&family=Barlow:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <nav className="nav">
          <div className="nav-in">
            <Link href="/" className="logo">
              <svg className="checker" viewBox="0 0 30 20" aria-hidden="true"><path d="M6 0H30L24 20H0Z" fill="var(--accent)" /><path d="M12 5H22L20 10H10ZM8 10H18L16 15H6Z" fill="var(--band)" /></svg>
              Diecast Garage
            </Link>
            <NavLinks items={[
              { href: "/", label: "Explore" },
              { href: "/for-sale", label: "For sale" },
              ...(user ? [{ href: "/feed", label: "Following" }, { href: "/garage", label: "My garage" }] : []),
              ...(isAdmin === true ? [{ href: "/admin", label: "Admin" }] : []),
            ]} />
            <div className="nav-right">
              {user ? (
                <>
                  {me && <Link className="btn small" href={`/c/${me.username}`}>My page</Link>}
                  <Link className="btn small" href="/settings">Settings</Link>
                </>
              ) : (
                <>
                  <Link className="btn small" href="/login">Sign in</Link>
                  <Link className="btn small primary" href="/signup">Join free</Link>
                </>
              )}
            </div>
          </div>
        </nav>
        {children}
        <footer className="footer">
          <div className="footer-in">
            <span>Diecast Garage <span className="num">v{currentVersion}</span> · test version</span>
            <Link href="/release-notes">Release notes</Link>
            {LEGAL_PAGES_LIVE && <><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></>}
          </div>
        </footer>
      </body>
    </html>
  );
}
