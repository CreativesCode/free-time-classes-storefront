import { NextRequest, NextResponse } from "next/server";
import {
  createClient as createSupabaseAdminClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_GENERATION_WEEKS,
  getGenerationHorizon,
  slotKey,
  slotsFromExtraException,
} from "@/lib/availability/ruleExpansion";
import type { AvailabilityException } from "@/types/availability";

const noStoreJson = (body: unknown, init?: ResponseInit) =>
  NextResponse.json(body, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Cache-Control": "no-store",
    },
  });

type BlockedBody = {
  type: "blocked";
  exception_date: string;
  start_time?: string | null;
  end_time?: string | null;
  reason?: string | null;
};

type ExtraBody = {
  type: "extra";
  exception_date: string;
  start_time: string;
  end_time: string;
  subject_id: number;
  duration_minutes: number;
  price: number;
  reason?: string | null;
};

type Body = BlockedBody | ExtraBody;

function normalizeTime(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  const v = String(value).trim();
  if (v.length === 5) return `${v}:00`;
  return v;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

async function deleteAvailableLessonsInRange(
  admin: SupabaseClient,
  tutorId: string,
  rangeStart: string,
  rangeEnd: string
): Promise<{ error?: string }> {
  const { data: lessons, error: lessonsError } = await admin
    .from("lessons")
    .select("id")
    .eq("tutor_id", tutorId)
    .eq("status", "available")
    .gte("scheduled_date_time", rangeStart)
    .lt("scheduled_date_time", rangeEnd);

  if (lessonsError) {
    return { error: "Could not load lessons to clear." };
  }

  const lessonIds = (lessons ?? []).map((l: { id: number }) => l.id);
  if (lessonIds.length === 0) return {};

  const { data: bookings, error: bookingsError } = await admin
    .from("bookings")
    .select("lesson_id")
    .in("lesson_id", lessonIds)
    .in("status", ["pending", "confirmed"]);

  if (bookingsError) {
    return { error: "Could not verify bookings." };
  }

  const booked = new Set(
    (bookings ?? []).map((b: { lesson_id: number }) => b.lesson_id)
  );
  const toDelete = lessonIds.filter((id) => !booked.has(id));
  if (toDelete.length === 0) return {};

  const { error: delErr } = await admin.from("lessons").delete().in("id", toDelete);
  if (delErr) {
    return { error: delErr.message || "Could not remove slots." };
  }
  return {};
}

export async function POST(request: NextRequest) {
  try {
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

    const body = (await request.json()) as Partial<Body>;
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

    if (body.type === "blocked") {
      const exceptionDate =
        typeof body.exception_date === "string" ? body.exception_date : "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(exceptionDate)) {
        return noStoreJson({ error: "Invalid exception_date." }, { status: 400 });
      }

      const st = normalizeTime(body.start_time);
      const et = normalizeTime(body.end_time);
      if ((st == null) !== (et == null)) {
        return noStoreJson(
          { error: "Provide both start_time and end_time, or neither for full day." },
          { status: 400 }
        );
      }

      const { data: inserted, error: insErr } = await admin
        .from("availability_exceptions")
        .insert({
          tutor_id: user.id,
          exception_date: exceptionDate,
          start_time: st,
          end_time: et,
          type: "blocked",
          reason: body.reason ?? null,
        })
        .select()
        .single();

      if (insErr || !inserted) {
        return noStoreJson(
          { error: insErr?.message || "Could not save exception." },
          { status: 400 }
        );
      }

      const [y, mo, da] = exceptionDate.split("-").map(Number);
      const dayStart = `${exceptionDate}T00:00:00`;
      const nextDay = new Date(y, mo - 1, da + 1);
      const dayEnd = `${nextDay.getFullYear()}-${pad(nextDay.getMonth() + 1)}-${pad(nextDay.getDate())}T00:00:00`;

      if (st == null && et == null) {
        const clearResult = await deleteAvailableLessonsInRange(
          admin,
          user.id,
          dayStart,
          dayEnd
        );
        if (clearResult.error) {
          return noStoreJson({ error: clearResult.error }, { status: 400 });
        }
      } else if (st && et) {
        const { data: lessons, error: lessonsError } = await admin
          .from("lessons")
          .select("id,scheduled_date_time,duration_minutes")
          .eq("tutor_id", user.id)
          .eq("status", "available")
          .gte("scheduled_date_time", dayStart)
          .lt("scheduled_date_time", dayEnd);

        if (lessonsError) {
          return noStoreJson(
            { error: "Could not load lessons to clear." },
            { status: 400 }
          );
        }

        const rs = new Date(
          y,
          mo - 1,
          da,
          parseInt(st.slice(0, 2), 10),
          parseInt(st.slice(3, 5), 10),
          0,
          0
        ).getTime();
        const re = new Date(
          y,
          mo - 1,
          da,
          parseInt(et.slice(0, 2), 10),
          parseInt(et.slice(3, 5), 10),
          0,
          0
        ).getTime();

        const overlapping = (lessons || []).filter((row) => {
          const raw = String(row.scheduled_date_time).replace(" ", "T");
          const startStr = raw.slice(0, 19);
          const slotStart = new Date(
            parseInt(startStr.slice(0, 4), 10),
            parseInt(startStr.slice(5, 7), 10) - 1,
            parseInt(startStr.slice(8, 10), 10),
            parseInt(startStr.slice(11, 13), 10),
            parseInt(startStr.slice(14, 16), 10),
            0,
            0
          ).getTime();
          const dur = (row.duration_minutes as number) * 60_000;
          const slotEnd = slotStart + dur;
          return slotStart < re && slotEnd > rs;
        });

        const lessonIds = overlapping.map((l) => l.id as number);
        if (lessonIds.length > 0) {
          const { data: bookings, error: bookingsError } = await admin
            .from("bookings")
            .select("lesson_id")
            .in("lesson_id", lessonIds)
            .in("status", ["pending", "confirmed"]);

          if (bookingsError) {
            return noStoreJson(
              { error: "Could not verify bookings." },
              { status: 400 }
            );
          }

          const booked = new Set(
            (bookings || []).map((b) => b.lesson_id as number)
          );
          const toDelete = lessonIds.filter((id) => !booked.has(id));
          if (toDelete.length > 0) {
            const { error: delErr } = await admin
              .from("lessons")
              .delete()
              .in("id", toDelete);
            if (delErr) {
              return noStoreJson(
                { error: delErr.message || "Could not remove slots." },
                { status: 400 }
              );
            }
          }
        }
      }

      return noStoreJson({ id: inserted.id }, { status: 200 });
    }

    if (body.type === "extra") {
      const exceptionDate =
        typeof body.exception_date === "string" ? body.exception_date : "";
      const subjectId = Number(body.subject_id);
      const durationMinutes = Number(body.duration_minutes);
      const price = Number(body.price);
      const st = normalizeTime(body.start_time);
      const et = normalizeTime(body.end_time);

      if (
        subjectId <= 0 ||
        !Number.isInteger(durationMinutes) ||
        durationMinutes < 30 ||
        !Number.isFinite(price) ||
        price < 0 ||
        !st ||
        !et ||
        !/^\d{4}-\d{2}-\d{2}$/.test(exceptionDate)
      ) {
        return noStoreJson({ error: "Invalid extra exception payload." }, { status: 400 });
      }

      const { data: inserted, error: insErr } = await admin
        .from("availability_exceptions")
        .insert({
          tutor_id: user.id,
          exception_date: exceptionDate,
          start_time: st,
          end_time: et,
          type: "extra",
          reason: body.reason ?? null,
          subject_id: subjectId,
          duration_minutes: durationMinutes,
          price,
        })
        .select()
        .single();

      if (insErr || !inserted) {
        return noStoreJson(
          { error: insErr?.message || "Could not save exception." },
          { status: 400 }
        );
      }

      const ex = inserted as AvailabilityException;
      const slots = slotsFromExtraException(ex);

      const { start, end } = getGenerationHorizon(DEFAULT_GENERATION_WEEKS);
      const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T00:00:00`;
      const endBound = new Date(end);
      endBound.setDate(endBound.getDate() + 1);
      const endStr = `${endBound.getFullYear()}-${pad(endBound.getMonth() + 1)}-${pad(endBound.getDate())}T00:00:00`;

      const { data: existingLessons, error: existingError } = await admin
        .from("lessons")
        .select("scheduled_date_time,subject_id,duration_minutes")
        .eq("tutor_id", user.id)
        .gte("scheduled_date_time", startStr)
        .lt("scheduled_date_time", endStr);

      if (existingError) {
        return noStoreJson(
          { error: "Could not check existing slots." },
          { status: 400 }
        );
      }

      const taken = new Set(
        (existingLessons || []).map((row) =>
          slotKey({
            scheduled_date_time: String(row.scheduled_date_time)
              .replace(" ", "T")
              .slice(0, 19),
            subject_id: row.subject_id as number,
            duration_minutes: row.duration_minutes as number,
            price: 0,
          })
        )
      );

      const rows = slots
        .filter((s) => !taken.has(slotKey(s)))
        .map((s) => ({
          tutor_id: user.id,
          subject_id: s.subject_id,
          scheduled_date_time: s.scheduled_date_time,
          duration_minutes: s.duration_minutes,
          price: s.price,
          status: "available" as const,
          availability_rule_id: null,
          updated_at: new Date().toISOString(),
        }));

      if (rows.length > 0) {
        const { error: insLessonsErr } = await admin.from("lessons").insert(rows);
        if (insLessonsErr) {
          return noStoreJson(
            { error: insLessonsErr.message || "Could not create extra slots." },
            { status: 400 }
          );
        }
      }

      return noStoreJson(
        { id: inserted.id, slotsCreated: rows.length },
        { status: 200 }
      );
    }

    return noStoreJson({ error: "Invalid type." }, { status: 400 });
  } catch (err) {
    console.error("[availability/exceptions POST] error:", err);
    return noStoreJson({ error: "Unexpected server error." }, { status: 500 });
  }
}
