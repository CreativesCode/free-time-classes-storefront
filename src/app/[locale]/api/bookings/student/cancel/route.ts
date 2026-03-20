import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type Body = {
  bookingId: number;
};

const DEFAULT_STUDENT_CANCEL_HOURS = 24;

function getStudentCancelHours(): number {
  const rawValue = process.env.BOOKING_STUDENT_CANCEL_HOURS;
  if (!rawValue) return DEFAULT_STUDENT_CANCEL_HOURS;

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_STUDENT_CANCEL_HOURS;
  return parsed;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Body>;
    const bookingId =
      typeof body.bookingId === "number" ? body.bookingId : Number(body.bookingId);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return NextResponse.json({ error: "Invalid bookingId." }, { status: 400 });
    }

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

    const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id,student_id,lesson_id,status")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.student_id !== user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (booking.status !== "pending" && booking.status !== "confirmed") {
      return NextResponse.json({ error: "This booking cannot be cancelled." }, { status: 409 });
    }

    if (booking.status === "confirmed") {
      if (!booking.lesson_id) {
        return NextResponse.json(
          { error: "Booking has no associated lesson to validate cancellation window." },
          { status: 409 }
        );
      }

      const { data: lesson, error: lessonError } = await admin
        .from("lessons")
        .select("id,scheduled_date_time")
        .eq("id", booking.lesson_id)
        .single();

      if (lessonError || !lesson) {
        return NextResponse.json(
          { error: "Associated lesson not found for this booking." },
          { status: 404 }
        );
      }

      if (!lesson.scheduled_date_time) {
        return NextResponse.json(
          { error: "Lesson has no scheduled date/time." },
          { status: 409 }
        );
      }

      const cancelHours = getStudentCancelHours();
      const nowMs = Date.now();
      const lessonMs = new Date(lesson.scheduled_date_time).getTime();

      if (!Number.isFinite(lessonMs)) {
        return NextResponse.json(
          { error: "Lesson date/time is invalid." },
          { status: 409 }
        );
      }

      const requiredNoticeMs = cancelHours * 60 * 60 * 1000;
      if (lessonMs - nowMs < requiredNoticeMs) {
        return NextResponse.json(
          {
            error: `You can only cancel confirmed bookings at least ${cancelHours} hours before the class.`,
          },
          { status: 409 }
        );
      }
    }

    const { error: cancelError } = await admin
      .from("bookings")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (cancelError) {
      return NextResponse.json(
        { error: cancelError.message || "Failed to cancel booking." },
        { status: 400 }
      );
    }

    if (booking.lesson_id) {
      await admin
        .from("lessons")
        .update({
          student_id: null,
          status: "available",
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.lesson_id);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[bookings/student/cancel] error:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

