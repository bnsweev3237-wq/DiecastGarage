import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SIGNED_IN_ONLY = ["/collection", "/feed", "/settings"];
// Pages someone who has entered their password but not yet their two-step code may still open.
const BEFORE_CODE = ["/two-step", "/auth", "/api", "/login", "/help", "/terms", "/privacy", "/forgot-password", "/reset-password"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  if (!data.user && SIGNED_IN_ONLY.some((p) => path === p || path.startsWith(p + "/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  // Two-step sign-in: until the code is entered, everything else sends them to enter it. The database
  // refuses their requests anyway (supabase/migrations/0036_two_step_signin.sql); this just explains why.
  if (data.user && !BEFORE_CODE.some((p) => path === p || path.startsWith(p + "/"))) {
    const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel().then((r) => r.data, () => null);
    if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      const url = request.nextUrl.clone();
      url.pathname = "/two-step";
      url.search = `?next=${encodeURIComponent(path)}`;
      return NextResponse.redirect(url);
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|sw.js|offline.html|manifest.webmanifest|icons/|brand/).*)"],
};
