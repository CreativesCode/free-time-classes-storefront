/**
 * Manual validation of course writes (no Zod in this project). Mirrors the
 * DB checks of migration 041 so errors come back as 400 with a field code.
 */
export const COURSE_DURATIONS = [30, 45, 60, 90, 120] as const;
export const COURSE_MAX_PRICE = 500;
const LEVELS = ["beginner", "intermediate", "advanced", "all"] as const;

export type CourseWrite = {
  title?: string;
  description?: string | null;
  subject_id?: number;
  level?: (typeof LEVELS)[number] | null;
  price_per_session?: number;
  duration_minutes?: number;
  cover_image?: string | null;
  is_active?: boolean;
};

export type CourseValidation =
  | { ok: true; value: CourseWrite }
  | { ok: false; field: string };

/**
 * `partial` = PATCH (only the given fields are checked and returned);
 * otherwise title, subject, price and duration are required.
 */
export function validateCourse(raw: unknown, partial: boolean): CourseValidation {
  if (!raw || typeof raw !== "object") return { ok: false, field: "body" };
  const input = raw as Record<string, unknown>;
  const out: CourseWrite = {};
  const has = (k: string) => input[k] !== undefined;

  if (has("title") || !partial) {
    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (title.length < 3 || title.length > 120) return { ok: false, field: "title" };
    out.title = title;
  }
  if (has("description")) {
    if (input.description === null) out.description = null;
    else if (typeof input.description === "string" && input.description.length <= 4000)
      out.description = input.description.trim() || null;
    else return { ok: false, field: "description" };
  }
  if (has("subject_id") || !partial) {
    const subjectId = Number(input.subject_id);
    if (!Number.isInteger(subjectId) || subjectId <= 0) return { ok: false, field: "subject_id" };
    out.subject_id = subjectId;
  }
  if (has("level")) {
    if (input.level === null || input.level === "") out.level = null;
    else if (LEVELS.includes(input.level as (typeof LEVELS)[number]))
      out.level = input.level as (typeof LEVELS)[number];
    else return { ok: false, field: "level" };
  }
  if (has("price_per_session") || !partial) {
    const price = Number(input.price_per_session);
    if (!Number.isFinite(price) || price <= 0 || price > COURSE_MAX_PRICE)
      return { ok: false, field: "price_per_session" };
    out.price_per_session = Math.round(price * 100) / 100;
  }
  if (has("duration_minutes") || !partial) {
    const duration = Number(input.duration_minutes);
    if (!COURSE_DURATIONS.includes(duration as (typeof COURSE_DURATIONS)[number]))
      return { ok: false, field: "duration_minutes" };
    out.duration_minutes = duration;
  }
  if (has("cover_image")) {
    if (input.cover_image === null) out.cover_image = null;
    else if (typeof input.cover_image === "string" && input.cover_image.length <= 300)
      out.cover_image = input.cover_image;
    else return { ok: false, field: "cover_image" };
  }
  if (has("is_active")) {
    if (typeof input.is_active !== "boolean") return { ok: false, field: "is_active" };
    out.is_active = input.is_active;
  }
  return { ok: true, value: out };
}
