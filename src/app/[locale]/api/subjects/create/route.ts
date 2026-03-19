import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

type Body = {
  tutorId: string;
  name: string;
};

export async function POST(
  request: NextRequest
) {
  try {
    const body = (await request.json()) as Partial<Body>;
    const tutorId = body.tutorId;
    const name = (body.name || "").trim();

    if (!tutorId || !name) {
      return NextResponse.json(
        { error: "Missing tutorId or subject name." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const missing: string[] = [];
    if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Server misconfigured: missing ${missing.join(", ")}.`,
        },
        { status: 500 }
      );
    }

    // Service role bypasses RLS (server-side only).
    const supabaseAdmin = createSupabaseAdminClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    const { data: createdSubject, error: createError } = await supabaseAdmin
      .from("subjects")
      .insert({ name })
      .select("id,name")
      .single();

    if (createError || !createdSubject) {
      return NextResponse.json(
        { error: createError?.message || "Failed to create subject." },
        { status: 400 }
      );
    }

    const { error: linkError } = await supabaseAdmin
      .from("tutor_subjects")
      .insert({ tutor_id: tutorId, subject_id: createdSubject.id });

    if (linkError) {
      return NextResponse.json(
        { error: linkError.message || "Failed to assign subject." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { createdSubjectId: createdSubject.id },
      { status: 200 }
    );
  } catch (err) {
    console.error("[subjects/create] error:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}

