import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const noStoreJson = (body: unknown, init?: ResponseInit) =>
  NextResponse.json(body, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Cache-Control": "no-store",
    },
  });

export async function POST() {
  try {
    if (process.env.NODE_ENV === "production") {
      return noStoreJson({ error: "Not available in production." }, { status: 404 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return noStoreJson({ error: "Unauthorized." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return noStoreJson(
        { error: "Server misconfigured: missing Supabase env vars." },
        { status: 500 }
      );
    }

    // Admin client to bypass RLS for dev seeding.
    const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const userId = user.id;

    // Ensure profiles exist (so foreign keys won't fail).
    await admin
      .from("student_profiles")
      .upsert({ id: userId }, { onConflict: "id" });
    await admin
      .from("tutor_profiles")
      .upsert({ id: userId }, { onConflict: "id" });

    // Pick any subject from the public catalog.
    const { data: subjects, error: subjectsError } = await admin
      .from("subjects")
      .select("id")
      .limit(1);

    if (subjectsError || !subjects || subjects.length === 0) {
      return noStoreJson(
        { error: "No hay materias disponibles en `subjects`." },
        { status: 400 }
      );
    }
    const subjectId = subjects[0].id as number;

    // Find a tutor that is NOT the current user so the lesson shows a different name.
    const { data: otherTutors, error: tutorError } = await admin
      .from("tutor_profiles")
      .select("id")
      .neq("id", userId)
      .limit(1);

    let tutorId: string;

    if (tutorError || !otherTutors || otherTutors.length === 0) {
      // No other tutor exists — fall back to current user (self-demo).
      tutorId = userId;
    } else {
      tutorId = otherTutors[0].id as string;
    }

    const scheduledAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Create a completed lesson.
    const { data: lesson, error: lessonError } = await admin
      .from("lessons")
      .insert({
        tutor_id: tutorId,
        student_id: userId,
        subject_id: subjectId,
        price: 0,
        scheduled_date_time: scheduledAt,
        duration_minutes: 60,
        status: "completed",
        availability_rule_id: null,
      })
      .select("id")
      .single();

    if (lessonError || !lesson) {
      return noStoreJson(
        { error: lessonError?.message || "No se pudo crear la lección demo." },
        { status: 400 }
      );
    }

    // Create a completed booking attached to the lesson.
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .insert({
        student_id: userId,
        tutor_id: tutorId,
        lesson_id: lesson.id,
        requested_date: scheduledAt,
        status: "confirmed",
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      return noStoreJson(
        { error: bookingError?.message || "No se pudo crear la reserva demo." },
        { status: 400 }
      );
    }

    // Create the review tied to the booking (1 review per booking_id).
    const rating = 5;
    const comment = "Clase demo: ¡muy útil y excelente explicación!";

    const { data: review, error: reviewError } = await admin
      .from("reviews")
      .insert({
        booking_id: booking.id,
        student_id: userId,
        tutor_id: tutorId,
        rating,
        comment,
      })
      .select("id, booking_id, tutor_id, student_id, rating")
      .single();

    if (reviewError || !review) {
      return noStoreJson(
        { error: reviewError?.message || "No se pudo crear la reseña demo." },
        { status: 400 }
      );
    }

    return noStoreJson(
      {
        ok: true,
        lessonId: lesson.id,
        bookingId: booking.id,
        reviewId: review.id,
        rating: review.rating,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[dev/seed-reviews] error:", err);
    return noStoreJson({ error: "Unexpected server error." }, { status: 500 });
  }
}

