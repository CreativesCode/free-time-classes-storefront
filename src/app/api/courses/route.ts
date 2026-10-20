import { NextRequest, NextResponse } from "next/server";
import { revalidateCatalog } from "@/lib/catalog/revalidateServer";
import { getTutorContext } from "@/lib/courses/courseApiAuth";
import { validateCourse } from "@/lib/courses/validateCourse";

const noStoreJson = (body: unknown, init?: ResponseInit) =>
  NextResponse.json(body, {
    ...init,
    headers: { ...(init?.headers ?? {}), "Cache-Control": "no-store" },
  });

/** Create a course for the signed-in tutor (PRP-001 phase 5). */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getTutorContext();
    if (!ctx.ok) return noStoreJson({ error: ctx.error }, { status: ctx.status });

    const body = await request.json().catch(() => null);
    const result = validateCourse(body, false);
    if (!result.ok) {
      return noStoreJson(
        { error: `Invalid ${result.field}.`, code: "invalid_field", field: result.field },
        { status: 400 }
      );
    }

    const { data: subject } = await ctx.admin
      .from("subjects")
      .select("id")
      .eq("id", result.value.subject_id)
      .maybeSingle();
    if (!subject) {
      return noStoreJson(
        { error: "Invalid subject_id.", code: "invalid_field", field: "subject_id" },
        { status: 400 }
      );
    }

    const { data: course, error } = await ctx.admin
      .from("courses")
      .insert({
        ...result.value,
        tutor_id: ctx.userId,
        // Group classes do not exist yet (product decision 2026-10-20).
        max_students: 1,
        is_active: result.value.is_active ?? true,
      })
      .select("*")
      .single();
    if (error || !course) {
      console.error("[courses POST] insert failed:", error);
      return noStoreJson({ error: "Could not create the course." }, { status: 400 });
    }

    revalidateCatalog();
    return noStoreJson(course, { status: 200 });
  } catch (err) {
    console.error("[courses POST] error:", err);
    return noStoreJson({ error: "Unexpected server error." }, { status: 500 });
  }
}
