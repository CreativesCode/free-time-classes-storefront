import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasGoogleConnection } from "@/lib/google-calendar";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const connected = await hasGoogleConnection(user.id);
    return NextResponse.json({ connected });
  } catch (err) {
    console.error("[google/status] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
