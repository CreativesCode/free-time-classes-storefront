import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type Body = {
  subjectId: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Body>;
    const subjectId =
      typeof body.subjectId === "number" ? body.subjectId : Number(body.subjectId);

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      return NextResponse.json({ error: "Invalid subjectId." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("is_tutor")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.is_tutor) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

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

    const { data: subject, error: subjectError } = await supabaseAdmin
      .from("subjects")
      .select("id,name")
      .eq("id", subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    }

    // Protect referential integrity for currently active domain entities.
    const [{ count: coursesCount, error: coursesError }, { count: lessonsCount, error: lessonsError }] =
      await Promise.all([
        supabaseAdmin
          .from("courses")
          .select("id", { count: "exact", head: true })
          .eq("subject_id", subjectId),
        supabaseAdmin
          .from("lessons")
          .select("id", { count: "exact", head: true })
          .eq("subject_id", subjectId),
      ]);

    if (coursesError || lessonsError) {
      return NextResponse.json(
        { error: "Could not validate subject usage." },
        { status: 500 }
      );
    }

    if ((coursesCount || 0) > 0 || (lessonsCount || 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete this subject because it is already used by courses or lessons.",
        },
        { status: 409 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("subjects")
      .delete()
      .eq("id", subjectId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete subject." },
        { status: 400 }
      );
    }

    return NextResponse.json({ deletedSubjectId: subjectId }, { status: 200 });
  } catch (err) {
    console.error("[subjects/delete] error:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

