import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { currentVersion } from "@/lib/releases";
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
          href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <nav className="nav">
          <div className="nav-in">
            <Link href="/" className="logo"><span className="checker" aria-hidden="true" />Diecast Garage</Link>
            <div className="nav-links">
              <Link href="/">Explore</Link>
              <Link href="/for-sale">For sale</Link>
              {user && <Link href="/feed">Following</Link>}
              {user && <Link href="/garage">My garage</Link>}
              {isAdmin === true && <Link href="/admin">Admin</Link>}
            </div>
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
          </div>
        </footer>
      </body>
    </html>
  );
}
