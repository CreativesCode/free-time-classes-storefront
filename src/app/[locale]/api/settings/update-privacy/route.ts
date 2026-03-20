import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type Body = {
  profile_visibility: "public" | "booking_only";
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Body>;
    const profile_visibility =
      body.profile_visibility === "public" || body.profile_visibility === "booking_only"
        ? body.profile_visibility
        : null;

    if (!profile_visibility) {
      return NextResponse.json({ error: "Invalid profile_visibility." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Update with a server client to avoid any client-side RLS surprises.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env vars." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        profile_visibility,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update privacy settings." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: true, profile_visibility },
      { status: 200 }
    );
  } catch (err) {
    console.error("[settings/update-privacy] error:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}

