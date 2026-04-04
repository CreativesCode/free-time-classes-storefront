import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const PRIVATE_READ_CACHE_CONTROL =
  "private, max-age=30, stale-while-revalidate=120";

function getLocalNowForTimestampFilter(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);
  return local;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env vars." },
        { status: 500 }
      );
    }

    const subjectIdParam = request.nextUrl.searchParams.get("subjectId");
    const subjectId =
      subjectIdParam && subjectIdParam.trim() !== ""
        ? Number(subjectIdParam)
        : null;

    const tutorIdParam = request.nextUrl.searchParams.get("tutorId")?.trim() ?? "";
    const tutorUuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const tutorId = tutorUuidRe.test(tutorIdParam) ? tutorIdParam : null;

    const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    let query = admin.from("lessons").select(
      `
      *,
      subject:subjects (
        id,
        name,
        description,
        icon
      ),
      tutor:tutor_profiles!lessons_tutor_id_fkey (
        id,
        user:users!tutor_profiles_id_fkey (
          id,
          username,
          email,
          profile_picture
        )
      ),
      student:student_profiles!lessons_student_id_fkey (
        id,
        user:users!student_profiles_id_fkey (
          id,
          username,
          email
        )
      )
    `
    );

    query = query
      .eq("status", "available")
      .gte("scheduled_date_time", getLocalNowForTimestampFilter());

    if (Number.isInteger(subjectId) && subjectId && subjectId > 0) {
      query = query.eq("subject_id", subjectId);
    }

    if (tutorId) {
      query = query.eq("tutor_id", tutorId);
    }

    const { data, error } = await query.order("scheduled_date_time", {
      ascending: true,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to load available lessons." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { items: data || [] },
      {
        status: 200,
        headers: { "Cache-Control": PRIVATE_READ_CACHE_CONTROL },
      }
    );
  } catch (err) {
    console.error("[lessons/available] error:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
