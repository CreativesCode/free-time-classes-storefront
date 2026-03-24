import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

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

    const { data: profile } = await supabase
      .from("users")
      .select("is_tutor")
      .eq("id", user.id)
      .single();

    if (!profile?.is_tutor) {
      return NextResponse.json({ error: "Only tutors can connect Google Calendar." }, { status: 403 });
    }

    const url = getGoogleAuthUrl(user.id);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[google/auth] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
