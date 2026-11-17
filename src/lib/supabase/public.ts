import { createClient } from "@supabase/supabase-js";

// Reads the database as a signed-out visitor, never with the current session. Used for share cards and
// link previews so they only ever show what anyone could see.
export const publicDb = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
