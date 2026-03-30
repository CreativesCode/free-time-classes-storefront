import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_GENERATION_WEEKS,
  enumerateSlotsForRule,
  getGenerationHorizon,
  slotKey,
} from "@/lib/availability/ruleExpansion";
import type {
  AvailabilityException,
  TutorAvailabilityRule,
} from "@/types/availability";

const noStoreJson = (body: unknown, init?: ResponseInit) =>
  NextResponse.json(body, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Cache-Control": "no-store",
    },
  });

type CreateBody = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject_id: number;
  duration_minutes: number;
  price: number;
};

function normalizeTime(value: string): string {
  const v = value.trim();
  if (v.length === 5) return `${v}:00`;
  return v;
}

function isMissingColumnInSchemaCache(
  err: { message?: string } | null | undefined,
  column: string
): boolean {
  const message = err?.message || "";
  return (
    message.includes("schema cache") &&
    message.includes(`'${column}'`) &&
    message.includes("'tutor_availability'")
  );
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

    const body = (await request.json()) as Partial<CreateBody>;
    const dayOfWeek = Number(body.day_of_week);
    const subjectId = Number(body.subject_id);
    const durationMinutes = Number(body.duration_minutes);
    const price = Number(body.price);
    const startTime = typeof body.start_time === "string" ? body.start_time : "";
    const endTime = typeof body.end_time === "string" ? body.end_time : "";

    if (
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 0 ||
      dayOfWeek > 6 ||
      !Number.isInteger(subjectId) ||
      subjectId <= 0 ||
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 30 ||
      !Number.isFinite(price) ||
      price < 0 ||
      !startTime ||
      !endTime
    ) {
      return noStoreJson({ error: "Invalid payload." }, { status: 400 });
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

    const st = normalizeTime(startTime);
    const et = normalizeTime(endTime);

    const { data: ruleRow, error: insertRuleError } = await admin
      .from("tutor_availability")
      .insert({
        tutor_id: user.id,
        day_of_week: dayOfWeek,
        start_time: st,
        end_time: et,
        subject_id: subjectId,
        duration_minutes: durationMinutes,
        price,
        is_active: true,
      })
      .select()
      .single();

    if (
      isMissingColumnInSchemaCache(insertRuleError, "duration_minutes") ||
      isMissingColumnInSchemaCache(insertRuleError, "subject_id") ||
      isMissingColumnInSchemaCache(insertRuleError, "price")
    ) {
      return noStoreJson(
        {
          error:
            "Supabase schema desactualizado. Aplica la migración 004_tutor_availability_exceptions.sql y recarga el schema cache de PostgREST.",
        },
        { status: 400 }
      );
    }

    if (insertRuleError || !ruleRow) {
      return noStoreJson(
        { error: insertRuleError?.message || "Could not save rule." },
        { status: 400 }
      );
    }

    const rule = ruleRow as TutorAvailabilityRule;

    const { data: exceptions, error: exError } = await admin
      .from("availability_exceptions")
      .select("*")
      .eq("tutor_id", user.id);

    if (exError) {
      return noStoreJson(
        { error: "Could not load exceptions." },
        { status: 400 }
      );
    }

    const blocked = (exceptions || []) as AvailabilityException[];
    const slots = enumerateSlotsForRule(rule, blocked, DEFAULT_GENERATION_WEEKS);

    const { start, end } = getGenerationHorizon(DEFAULT_GENERATION_WEEKS);
    const pad = (n: number) => String(n).padStart(2, "0");
    const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T00:00:00`;
    const endBound = new Date(end);
    endBound.setDate(endBound.getDate() + 1);
    const endStr = `${endBound.getFullYear()}-${pad(endBound.getMonth() + 1)}-${pad(endBound.getDate())}T00:00:00`;

    const { data: existingLessons, error: existingError } = await admin
      .from("lessons")
      .select("scheduled_date_time,subject_id,duration_minutes,price")
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
      (existingLessons || []).map((row) => {
        const slot = {
          scheduled_date_time: String(row.scheduled_date_time)
            .replace(" ", "T")
            .slice(0, 19),
          subject_id: row.subject_id as number,
          duration_minutes: row.duration_minutes as number,
          price: Number(row.price ?? 0),
        };
        return slotKey(slot);
      })
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
        availability_rule_id: rule.id,
        updated_at: new Date().toISOString(),
      }));

    if (rows.length > 0) {
      const chunk = 80;
      for (let i = 0; i < rows.length; i += chunk) {
        const part = rows.slice(i, i + chunk);
        const { error: insErr } = await admin.from("lessons").insert(part);
        if (insErr) {
          await admin.from("tutor_availability").delete().eq("id", rule.id);
          return noStoreJson(
            { error: insErr.message || "Could not generate slots." },
            { status: 400 }
          );
        }
      }
    }

    return noStoreJson(
      {
        ruleId: rule.id,
        slotsCreated: rows.length,
        generationStart: startStr,
        generationEnd: endStr,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[availability/rules POST] error:", err);
    return noStoreJson({ error: "Unexpected server error." }, { status: 500 });
  }
}
