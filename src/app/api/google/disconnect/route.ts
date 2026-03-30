import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteGoogleTokens } from "@/lib/google-calendar";

const noStoreJson = (body: unknown, init?: ResponseInit) =>
  NextResponse.json(body, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Cache-Control": "no-store",
    },
  });

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return noStoreJson({ error: "Unauthorized." }, { status: 401 });
    }

    await deleteGoogleTokens(user.id);
    return noStoreJson({ ok: true });
  } catch (err) {
    console.error("[google/disconnect] error:", err);
    return noStoreJson({ error: "Internal server error." }, { status: 500 });
  }
}
