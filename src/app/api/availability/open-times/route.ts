import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import {
  loadBookableCourse,
  loadOpenStartTimes,
} from "@/lib/availability/loadOpenStartTimes";

// Public (no login needed to browse times). Only start times leave the
// server: no student, lesson or booking data.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const json = (body: unknown, init?: ResponseInit) =>
  NextResponse.json(body, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
    },
  });

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const courseId = Number(params.get("courseId"));
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return json({ error: "Invalid courseId." }, { status: 400 });
  }
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;
  if ((from && !DATE_RE.test(from)) || (to && !DATE_RE.test(to))) {
    return json({ error: "Dates must be YYYY-MM-DD." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Server misconfigured." }, { status: 500 });
  }
  const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const course = await loadBookableCourse(admin, courseId);
    if (!course) return json({ error: "Course not found." }, { status: 404 });

    const times = await loadOpenStartTimes(admin, course, { fromDate: from, toDate: to });
    return json({
      course: {
        id: course.id,
        durationMinutes: course.duration_minutes,
        pricePerSession: course.price_per_session,
      },
      times,
    });
  } catch (err) {
    console.error("[availability/open-times] error:", err);
    return json({ error: "Unexpected server error." }, { status: 500 });
  }
}
