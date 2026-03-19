import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type Body = {
  lessonId: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Body>;
    const lessonId =
      typeof body.lessonId === "number" ? body.lessonId : Number(body.lessonId);

    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      return NextResponse.json({ error: "Invalid lessonId." }, { status: 400 });
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
      .select("is_student")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.is_student) {
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

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from("lessons")
      .select("id,tutor_id,status,student_id")
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    if (lesson.status !== "available" || lesson.student_id) {
      return NextResponse.json(
        { error: "This slot is no longer available." },
        { status: 409 }
      );
    }

    const { data: updatedLesson, error: updateError } = await supabaseAdmin
      .from("lessons")
      .update({
        student_id: user.id,
        status: "scheduled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", lessonId)
      .eq("status", "available")
      .is("student_id", null)
      .select("id,tutor_id")
      .single();

    if (updateError || !updatedLesson) {
      return NextResponse.json(
        { error: "This slot is no longer available." },
        { status: 409 }
      );
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        student_id: user.id,
        tutor_id: updatedLesson.tutor_id,
        lesson_id: updatedLesson.id,
        requested_date: new Date().toISOString(),
        status: "pending",
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      // Rollback lesson assignment if booking creation fails.
      await supabaseAdmin
        .from("lessons")
        .update({
          student_id: null,
          status: "available",
          updated_at: new Date().toISOString(),
        })
        .eq("id", updatedLesson.id);

      return NextResponse.json(
        { error: bookingError?.message || "Failed to create booking." },
        { status: 400 }
      );
    }

    return NextResponse.json({ bookingId: booking.id }, { status: 200 });
  } catch (err) {
    console.error("[bookings/request] error:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

