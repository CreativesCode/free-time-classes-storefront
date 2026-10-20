import { NextResponse } from "next/server";
import { revalidateCatalog } from "@/lib/catalog/revalidateServer";
import { createClient } from "@/lib/supabase/server";

const noStoreJson = (body: unknown, init?: ResponseInit) =>
  NextResponse.json(body, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Cache-Control": "no-store",
    },
  });

/**
 * Invalidates the cached public catalog after a tutor changes courses,
 * subjects or profile data from the browser (those writes go straight to
 * Supabase, so the server has no other hook to refresh the ISR caches).
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return noStoreJson({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("is_tutor")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.is_tutor) {
      return noStoreJson({ error: "Forbidden." }, { status: 403 });
    }

    revalidateCatalog();

    return noStoreJson({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[catalog/revalidate] error:", err);
    return noStoreJson({ error: "Unexpected server error." }, { status: 500 });
  }
}
