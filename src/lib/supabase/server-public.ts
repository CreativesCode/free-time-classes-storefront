import { createClient } from "@supabase/supabase-js";

export function createPublicServerClient() {
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseKey) {
    throw new Error(
      "Missing Supabase public env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
