import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { syncRuleSlots } from "@/lib/availability/syncRuleSlots";
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
    const sync = await syncRuleSlots(admin, rule, blocked);

    if (sync.error) {
      await admin.from("tutor_availability").delete().eq("id", rule.id);
      return noStoreJson({ error: sync.error }, { status: 400 });
    }

    return noStoreJson(
      {
        ruleId: rule.id,
        slotsCreated: sync.slotsCreated,
        generationStart: sync.generationStart,
        generationEnd: sync.generationEnd,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[availability/rules POST] error:", err);
    return noStoreJson({ error: "Unexpected server error." }, { status: 500 });
  }
}
