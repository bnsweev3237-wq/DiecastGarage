import type { Metadata } from "next";
import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import Logo from "@/components/Logo";
import { getUser } from "@/lib/supabase/server";
import { currentVersion } from "@/lib/releases";
import { LEGAL_PAGES_LIVE } from "@/lib/legal-flags";
import "./globals.css";

const description = "The Diecast Racing Society. Show off your race car diecast collection, follow other collectors, and value your cars from real sold listings.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Racasto · The Diecast Racing Society", template: "%s · Racasto" },
  description,
  applicationName: "Racasto",
  openGraph: { siteName: "Racasto", title: "Racasto · The Diecast Racing Society", description, type: "website" },
  twitter: { card: "summary_large_image", title: "Racasto · The Diecast Racing Society", description },
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
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@112,900&family=Barlow+Condensed:ital,wght@1,700;1,800;1,900&family=Barlow:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <nav className="nav">
          <div className="nav-in">
            <Link href="/" className="logo" aria-label="Racasto home">
              <Logo />
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
            <span>Racasto · The Diecast Racing Society · <span className="num">v{currentVersion}</span> test version</span>
            <Link href="/release-notes">Release notes</Link>
            {LEGAL_PAGES_LIVE && <><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></>}
          </div>
        </footer>
      </body>
    </html>
  );
}
