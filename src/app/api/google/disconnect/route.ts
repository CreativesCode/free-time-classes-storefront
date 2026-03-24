import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteGoogleTokens } from "@/lib/google-calendar";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await deleteGoogleTokens(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[google/disconnect] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
