import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAuthUrl, GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/google-calendar";

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

    // Random state bound to this browser; the callback checks it against the
    // cookie and takes the user from the session, never from the state.
    const state = crypto.randomUUID();
    const response = NextResponse.json({ url: getGoogleAuthUrl(state) });
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/google/callback",
      maxAge: 10 * 60,
    });
    return response;
  } catch (err) {
    console.error("[google/auth] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
