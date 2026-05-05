import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createMeetEvent, hasGoogleConnection } from "@/lib/google-calendar";
import { insertNotification } from "@/lib/notifications";
import { nowPlusMinutesAsLessonTimestamp } from "@/lib/datetime/lessonTime";

const CUSTOM_REQUEST_EXPIRY_MINUTES = 15;

const noStoreJson = (body: unknown, init?: ResponseInit) =>
  NextResponse.json(body, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Cache-Control": "no-store",
    },
  });

type Body = {
  bookingId: number;
  action: "confirm" | "reject";
  reason?: string;
  meetLink?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Body>;
    const bookingId =
      typeof body.bookingId === "number" ? body.bookingId : Number(body.bookingId);
    const action = body.action;

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return noStoreJson({ error: "Invalid bookingId." }, { status: 400 });
    }
    if (action !== "confirm" && action !== "reject") {
      return noStoreJson({ error: "Invalid action." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return noStoreJson({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("is_tutor")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.is_tutor) {
      return noStoreJson({ error: "Forbidden." }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return noStoreJson(
        { error: "Server misconfigured: missing Supabase env vars." },
        { status: 500 }
      );
    }

    const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select(
        "id,tutor_id,student_id,lesson_id,status,requested_subject_id,requested_scheduled_date_time,requested_duration_minutes"
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return noStoreJson({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.tutor_id !== user.id) {
      return noStoreJson({ error: "Forbidden." }, { status: 403 });
    }

    if (booking.status !== "pending") {
      return noStoreJson(
        { error: "Only pending bookings can be updated." },
        { status: 409 }
      );
    }

    const isCustomRequest = booking.lesson_id == null;

    if (
      isCustomRequest &&
      (!booking.requested_subject_id ||
        !booking.requested_scheduled_date_time ||
        !booking.requested_duration_minutes)
    ) {
      return noStoreJson(
        { error: "Custom request is missing required fields." },
        { status: 409 }
      );
    }

    if (action === "confirm") {
      let lessonIdForFlow: number | null = booking.lesson_id ?? null;

      if (isCustomRequest) {
        const expiryCutoff = nowPlusMinutesAsLessonTimestamp(CUSTOM_REQUEST_EXPIRY_MINUTES);
        if ((booking.requested_scheduled_date_time as string) < expiryCutoff) {
          await admin
            .from("bookings")
            .update({ status: "rejected", updated_at: new Date().toISOString() })
            .eq("id", bookingId);
          return noStoreJson(
            { error: "This request has expired.", code: "request_expired" },
            { status: 410 }
          );
        }

        const { data: tutorProfile } = await admin
          .from("tutor_profiles")
          .select("hourly_rate")
          .eq("id", user.id)
          .single();

        const hourlyRate = Number(tutorProfile?.hourly_rate ?? 0);
        const duration = booking.requested_duration_minutes as number;
        const computedPrice = hourlyRate > 0
          ? Math.round(((hourlyRate * duration) / 60) * 100) / 100
          : 0;

        const { data: createdLesson, error: lessonInsertError } = await admin
          .from("lessons")
          .insert({
            tutor_id: user.id,
            student_id: booking.student_id,
            subject_id: booking.requested_subject_id,
            scheduled_date_time: booking.requested_scheduled_date_time,
            duration_minutes: duration,
            price: computedPrice,
            status: "scheduled",
          })
          .select("id")
          .single();

        if (lessonInsertError || !createdLesson) {
          console.error(
            "[bookings/tutor/respond] custom request lesson insert failed:",
            lessonInsertError
          );
          return noStoreJson(
            { error: lessonInsertError?.message || "Failed to create lesson for request." },
            { status: 400 }
          );
        }

        lessonIdForFlow = createdLesson.id;
      }

      const { error: updateError } = await admin
        .from("bookings")
        .update({
          status: "confirmed",
          ...(isCustomRequest && lessonIdForFlow
            ? { lesson_id: lessonIdForFlow }
            : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (updateError) {
        return noStoreJson(
          { error: updateError.message || "Failed to confirm booking." },
          { status: 400 }
        );
      }

      const manualMeetLink = typeof body.meetLink === "string" ? body.meetLink.trim() : "";
      let finalMeetLink = manualMeetLink;
      let googleEventId: string | null = null;

      if (!manualMeetLink && lessonIdForFlow) {
        const googleConnected = await hasGoogleConnection(user.id);
        if (googleConnected) {
          const { data: lessonData } = await admin
            .from("lessons")
            .select("scheduled_date_time,duration_minutes,student_id,subject_id")
            .eq("id", lessonIdForFlow)
            .single();

          if (lessonData?.scheduled_date_time) {
            let studentEmail = "";
            if (lessonData.student_id) {
              const { data: studentUser } = await admin
                .from("users")
                .select("email")
                .eq("id", lessonData.student_id)
                .single();
              studentEmail = studentUser?.email ?? "";
            }

            const { data: subject } = await admin
              .from("subjects")
              .select("name")
              .eq("id", lessonData.subject_id)
              .single();

            try {
              const result = await createMeetEvent({
                tutorId: user.id,
                summary: `FreeTime Class: ${subject?.name ?? "Lesson"}`,
                description: "Clase creada automáticamente desde FreeTime Classes",
                startTime: lessonData.scheduled_date_time,
                durationMinutes: lessonData.duration_minutes,
                attendeeEmails: studentEmail ? [studentEmail] : [],
              });

              if (result) {
                finalMeetLink = result.meetLink;
                googleEventId = result.eventId;
              }
            } catch (meetErr) {
              console.error("[bookings/tutor/respond] Google Meet auto-create failed:", meetErr);
            }
          }
        }
      }

      if (lessonIdForFlow && (finalMeetLink || googleEventId)) {
        const lessonUpdate: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (finalMeetLink) lessonUpdate.meet_link = finalMeetLink;
        if (googleEventId) lessonUpdate.google_event_id = googleEventId;

        await admin
          .from("lessons")
          .update(lessonUpdate)
          .eq("id", lessonIdForFlow);
      }

      // Notify student about confirmation
      const { data: tutorUser } = await admin
        .from("users")
        .select("username")
        .eq("id", user.id)
        .single();

      await insertNotification(admin, {
        userId: booking.student_id,
        type: "booking_confirmed",
        title: "Clase confirmada",
        body: `${tutorUser?.username ?? "Tu tutor"} ha confirmado tu solicitud de clase.`,
        data: { booking_id: bookingId, lesson_id: lessonIdForFlow },
      });

      return noStoreJson({ ok: true, meetLink: finalMeetLink || null }, { status: 200 });
    }

    // action === "reject"
    const { error: rejectError } = await admin
      .from("bookings")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (rejectError) {
      return noStoreJson(
        { error: rejectError.message || "Failed to reject booking." },
        { status: 400 }
      );
    }

    if (booking.lesson_id) {
      const { data: lessonToReject } = await admin
        .from("lessons")
        .select("google_event_id")
        .eq("id", booking.lesson_id)
        .single();

      if (lessonToReject?.google_event_id) {
        try {
          const { deleteMeetEvent } = await import("@/lib/google-calendar");
          await deleteMeetEvent(user.id, lessonToReject.google_event_id);
        } catch (meetErr) {
          console.error("[bookings/tutor/respond] Google event delete failed:", meetErr);
        }
      }

      await admin
        .from("lessons")
        .update({
          student_id: null,
          status: "available",
          meet_link: null,
          google_event_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.lesson_id);
    }

    // Notify student about rejection
    const { data: tutorUserReject } = await admin
      .from("users")
      .select("username")
      .eq("id", user.id)
      .single();

    await insertNotification(admin, {
      userId: booking.student_id,
      type: "booking_rejected",
      title: "Solicitud rechazada",
      body: `${tutorUserReject?.username ?? "Tu tutor"} no pudo aceptar tu solicitud de clase.`,
      data: { booking_id: bookingId, lesson_id: booking.lesson_id },
    });

    return noStoreJson({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[bookings/tutor/respond] error:", err);
    return noStoreJson({ error: "Unexpected server error." }, { status: 500 });
  }
}

