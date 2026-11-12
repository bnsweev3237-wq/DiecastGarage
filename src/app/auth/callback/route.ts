import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The link in the confirmation email lands here.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next")?.startsWith("/") ? url.searchParams.get("next")! : "/collection";
  if (code) await createClient().auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(next, url.origin));
}
