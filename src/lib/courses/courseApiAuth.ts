import {
  createClient as createSupabaseAdminClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type TutorContext =
  | { ok: true; userId: string; admin: SupabaseClient }
  | { ok: false; status: number; error: string };

/** Authenticated tutor + service-role client for the /api/courses routes. */
export async function getTutorContext(): Promise<TutorContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { ok: false, status: 401, error: "Unauthorized." };

  const { data: profile } = await supabase
    .from("users")
    .select("is_tutor")
    .eq("id", user.id)
    .single();
  if (!profile?.is_tutor) return { ok: false, status: 403, error: "Forbidden." };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, status: 500, error: "Server misconfigured." };

  return {
    ok: true,
    userId: user.id,
    admin: createSupabaseAdminClient(url, key, { auth: { persistSession: false } }),
  };
}
