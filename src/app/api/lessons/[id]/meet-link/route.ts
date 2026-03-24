import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const lessonId = Number(rawId);
    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      return NextResponse.json({ error: "Invalid lesson id." }, { status: 400 });
    }

    const body = (await request.json()) as { meetLink?: string };
    const meetLink = typeof body.meetLink === "string" ? body.meetLink.trim() : "";

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
        { error: "Server misconfigured." },
        { status: 500 }
      );
    }

    const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: lesson, error: lessonError } = await admin
      .from("lessons")
      .select("id, tutor_id, status")
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    if (lesson.tutor_id !== user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { error: updateError } = await admin
      .from("lessons")
      .update({
        meet_link: meetLink || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lessonId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update meet link." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[lessons/meet-link] error:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
