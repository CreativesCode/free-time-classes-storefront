import { NextRequest, NextResponse } from "next/server";
import { revalidateCatalog } from "@/lib/catalog/revalidateServer";
import { getTutorContext } from "@/lib/courses/courseApiAuth";
import { validateCourse } from "@/lib/courses/validateCourse";

const noStoreJson = (body: unknown, init?: ResponseInit) =>
  NextResponse.json(body, {
    ...init,
    headers: { ...(init?.headers ?? {}), "Cache-Control": "no-store" },
  });

type RouteContext = { params: Promise<{ id: string }> };

async function loadOwnCourse(id: string) {
  const courseId = Number(id);
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return { error: noStoreJson({ error: "Invalid course id." }, { status: 400 }) } as const;
  }
  const ctx = await getTutorContext();
  if (!ctx.ok) {
    return { error: noStoreJson({ error: ctx.error }, { status: ctx.status }) } as const;
  }
  const { data: course } = await ctx.admin
    .from("courses")
    .select("id, tutor_id")
    .eq("id", courseId)
    .maybeSingle();
  if (!course || course.tutor_id !== ctx.userId) {
    return { error: noStoreJson({ error: "Course not found." }, { status: 404 }) } as const;
  }
  return { ctx, courseId } as const;
}

/** Edit an own course. Booked classes keep the price/duration they copied. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const loaded = await loadOwnCourse((await context.params).id);
    if ("error" in loaded) return loaded.error;
    const { ctx, courseId } = loaded;

    const body = await request.json().catch(() => null);
    const result = validateCourse(body, true);
    if (!result.ok) {
      return noStoreJson(
        { error: `Invalid ${result.field}.`, code: "invalid_field", field: result.field },
        { status: 400 }
      );
    }

    const { data: course, error } = await ctx.admin
      .from("courses")
      .update({ ...result.value, updated_at: new Date().toISOString() })
      .eq("id", courseId)
      .select("*")
      .single();
    if (error || !course) {
      console.error("[courses PATCH] update failed:", error);
      return noStoreJson({ error: "Could not update the course." }, { status: 400 });
    }

    revalidateCatalog();
    return noStoreJson(course, { status: 200 });
  } catch (err) {
    console.error("[courses PATCH] error:", err);
    return noStoreJson({ error: "Unexpected server error." }, { status: 500 });
  }
}

/**
 * Delete an own course. A course with classes or bookings is archived
 * (is_active = false) so its history stays intact (F062).
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const loaded = await loadOwnCourse((await context.params).id);
    if ("error" in loaded) return loaded.error;
    const { ctx, courseId } = loaded;

    const [{ count: lessonCount }, { count: bookingCount }] = await Promise.all([
      ctx.admin
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId),
      ctx.admin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId),
    ]);

    if ((lessonCount ?? 0) > 0 || (bookingCount ?? 0) > 0) {
      const { error } = await ctx.admin
        .from("courses")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", courseId);
      if (error) {
        return noStoreJson({ error: "Could not archive the course." }, { status: 400 });
      }
      revalidateCatalog();
      return noStoreJson({ ok: true, archived: true }, { status: 200 });
    }

    const { error } = await ctx.admin.from("courses").delete().eq("id", courseId);
    if (error) return noStoreJson({ error: "Could not delete the course." }, { status: 400 });

    // Its cover images are stored under `${courseId}/` (G-prof-3); best effort.
    const folder = String(courseId);
    const { data: covers } = await ctx.admin.storage.from("course_covers").list(folder);
    if (covers?.length) {
      const { error: removeError } = await ctx.admin.storage
        .from("course_covers")
        .remove(covers.map((file) => `${folder}/${file.name}`));
      if (removeError) console.warn("[courses DELETE] covers not removed:", removeError.message);
    }
    revalidateCatalog();
    return noStoreJson({ ok: true, archived: false }, { status: 200 });
  } catch (err) {
    console.error("[courses DELETE] error:", err);
    return noStoreJson({ error: "Unexpected server error." }, { status: 500 });
  }
}
