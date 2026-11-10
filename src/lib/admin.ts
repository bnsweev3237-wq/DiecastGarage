import "server-only";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Everyone who isn't an admin gets a plain 404, so the portal's existence stays hidden.
export async function requireAdmin() {
  const { user } = await getUser();
  if (!user) notFound();
  const db = createAdminClient();
  const { data } = await db.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!data) notFound();
  return { adminId: user.id, db };
}

export async function logAdminAction(
  db: ReturnType<typeof createAdminClient>, adminId: string, action: string, targetUser: string | null, detail: Record<string, unknown> = {},
) {
  await db.from("admin_log").insert({ admin_id: adminId, action, target_user: targetUser, detail });
}

export const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
