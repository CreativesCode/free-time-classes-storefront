import type { SupabaseClient } from "@supabase/supabase-js";
import { createMeetEvent, hasGoogleConnection } from "@/lib/google-calendar";
import { insertNotification } from "@/lib/notifications";
import { nowPlusMinutesAsLessonTimestamp } from "@/lib/datetime/lessonTime";

export const CUSTOM_REQUEST_EXPIRY_MINUTES = 15;

export type RespondAction = "confirm" | "reject";

export interface RespondResult {
  httpStatus: number;
  payload: Record<string, unknown>;
}

/**
 * Core confirm/reject logic for a booking, shared by the tutor API route
 * (auth via session) and the WhatsApp webhook (auth via @lid match).
 *
 * The caller is responsible for authorizing `tutorId` — this function still
 * re-checks that the booking belongs to that tutor and is pending.
 *
 * Returns an HTTP-shaped result so the API route can return it verbatim and
 * the webhook can branch on `httpStatus === 200`.
 */
export async function respondToBooking(
  admin: SupabaseClient,
  args: {
    bookingId: number;
    tutorId: string;
    action: RespondAction;
    /** Optional manual Meet link; when absent, auto-create via Google if connected. */
    meetLink?: string;
  },
): Promise<RespondResult> {
  const { bookingId, tutorId, action } = args;

  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .select(
      "id,tutor_id,student_id,lesson_id,status,requested_subject_id,requested_scheduled_date_time,requested_duration_minutes",
    )
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return { httpStatus: 404, payload: { error: "Booking not found." } };
  }

  if (booking.tutor_id !== tutorId) {
    return { httpStatus: 403, payload: { error: "Forbidden." } };
  }

  if (booking.status !== "pending") {
    return {
      httpStatus: 409,
      payload: { error: "Only pending bookings can be updated." },
    };
  }

  const isCustomRequest = booking.lesson_id == null;

  if (
    isCustomRequest &&
    (!booking.requested_subject_id ||
      !booking.requested_scheduled_date_time ||
      !booking.requested_duration_minutes)
  ) {
    return {
      httpStatus: 409,
      payload: { error: "Custom request is missing required fields." },
    };
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
        return {
          httpStatus: 410,
          payload: { error: "This request has expired.", code: "request_expired" },
        };
      }

      const { data: tutorProfile } = await admin
        .from("tutor_profiles")
        .select("hourly_rate")
        .eq("id", tutorId)
        .single();

      const hourlyRate = Number(tutorProfile?.hourly_rate ?? 0);
      const duration = booking.requested_duration_minutes as number;
      const computedPrice =
        hourlyRate > 0 ? Math.round(((hourlyRate * duration) / 60) * 100) / 100 : 0;

      const { data: createdLesson, error: lessonInsertError } = await admin
        .from("lessons")
        .insert({
          tutor_id: tutorId,
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
          "[respondToBooking] custom request lesson insert failed:",
          lessonInsertError,
        );
        return {
          httpStatus: 400,
          payload: {
            error: lessonInsertError?.message || "Failed to create lesson for request.",
          },
        };
      }

      lessonIdForFlow = createdLesson.id;
    }

    const { error: updateError } = await admin
      .from("bookings")
      .update({
        status: "confirmed",
        ...(isCustomRequest && lessonIdForFlow ? { lesson_id: lessonIdForFlow } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (updateError) {
      return {
        httpStatus: 400,
        payload: { error: updateError.message || "Failed to confirm booking." },
      };
    }

    const manualMeetLink = typeof args.meetLink === "string" ? args.meetLink.trim() : "";
    let finalMeetLink = manualMeetLink;
    let googleEventId: string | null = null;

    if (!manualMeetLink && lessonIdForFlow) {
      const googleConnected = await hasGoogleConnection(tutorId);
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
              tutorId,
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
            console.error("[respondToBooking] Google Meet auto-create failed:", meetErr);
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

      await admin.from("lessons").update(lessonUpdate).eq("id", lessonIdForFlow);
    }

    // Notify student about confirmation
    const { data: tutorUser } = await admin
      .from("users")
      .select("username")
      .eq("id", tutorId)
      .single();

    // Resolve the scheduled time for the student message: from the request for
    // custom bookings, otherwise from the (existing) lesson.
    let scheduledForNotify: string | null = isCustomRequest
      ? (booking.requested_scheduled_date_time as string | null)
      : null;
    if (!scheduledForNotify && lessonIdForFlow) {
      const { data: lessonForNotify } = await admin
        .from("lessons")
        .select("scheduled_date_time")
        .eq("id", lessonIdForFlow)
        .single();
      scheduledForNotify = lessonForNotify?.scheduled_date_time ?? null;
    }

    await insertNotification(admin, {
      userId: booking.student_id,
      type: "booking_confirmed",
      title: "Clase confirmada",
      body: finalMeetLink
        ? `${tutorUser?.username ?? "Tu tutor"} ha confirmado tu clase. Aquí tienes el enlace de la videollamada:`
        : `${tutorUser?.username ?? "Tu tutor"} ha confirmado tu solicitud de clase.`,
      data: {
        booking_id: bookingId,
        lesson_id: lessonIdForFlow,
        ...(finalMeetLink ? { meet_link: finalMeetLink } : {}),
        ...(scheduledForNotify ? { scheduled_date_time: scheduledForNotify } : {}),
      },
    });

    return {
      httpStatus: 200,
      payload: { ok: true, meetLink: finalMeetLink || null, lessonId: lessonIdForFlow },
    };
  }

  // action === "reject"
  const { error: rejectError } = await admin
    .from("bookings")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", bookingId);

  if (rejectError) {
    return {
      httpStatus: 400,
      payload: { error: rejectError.message || "Failed to reject booking." },
    };
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
        await deleteMeetEvent(tutorId, lessonToReject.google_event_id);
      } catch (meetErr) {
        console.error("[respondToBooking] Google event delete failed:", meetErr);
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
    .eq("id", tutorId)
    .single();

  await insertNotification(admin, {
    userId: booking.student_id,
    type: "booking_rejected",
    title: "Solicitud rechazada",
    body: `${tutorUserReject?.username ?? "Tu tutor"} no pudo aceptar tu solicitud de clase.`,
    data: { booking_id: bookingId, lesson_id: booking.lesson_id },
  });

  return { httpStatus: 200, payload: { ok: true } };
}
