import { createClient } from "@supabase/supabase-js";

// Bypasses row level security. Server only: used by the Stripe webhook and checkout.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}
