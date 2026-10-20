import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasGoogleConnection } from "@/lib/google-calendar";

// Booking/slot state changes on every request/response: never reuse a
// browser-cached copy (it made confirmed requests reappear as pending).
const PRIVATE_READ_CACHE_CONTROL = "private, no-store";

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
    return NextResponse.json(
      { connected },
      {
        headers: { "Cache-Control": PRIVATE_READ_CACHE_CONTROL },
      }
    );
  } catch (err) {
    console.error("[google/status] error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
