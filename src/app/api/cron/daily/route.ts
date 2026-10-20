import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { syncRuleSlots } from "@/lib/availability/syncRuleSlots";
import { completeFinishedBookings } from "@/lib/bookings/completeFinished";
import type {
  AvailabilityException,
  TutorAvailabilityRule,
} from "@/types/availability";

// Daily job (Vercel Cron, see vercel.json). Idempotent:
// - keeps the rolling 12-week slot window filled for every active rule;
// - marks confirmed bookings whose class already ended as completed.
export const maxDuration = 60;

const noStoreJson = (body: unknown, init?: ResponseInit) =>
  NextResponse.json(body, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Cache-Control": "no-store",
    },
  });

const INBOUND_RETENTION_DAYS = 30;

export async function GET(request: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Fail closed when
  // the secret is not configured.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
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

  const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: rules, error: rulesError } = await admin
    .from("tutor_availability")
    .select("*")
    .eq("is_active", true);

  if (rulesError) {
    console.error("[cron/daily] could not load rules:", rulesError);
    return noStoreJson({ error: "Could not load rules." }, { status: 500 });
  }

  const activeRules = (rules || []) as TutorAvailabilityRule[];
  const tutorIds = [...new Set(activeRules.map((r) => r.tutor_id))];

  const exceptionsByTutor = new Map<string, AvailabilityException[]>();
  if (tutorIds.length > 0) {
    const { data: exceptions, error: exError } = await admin
      .from("availability_exceptions")
      .select("*")
      .in("tutor_id", tutorIds);
    if (exError) {
      console.error("[cron/daily] could not load exceptions:", exError);
      return noStoreJson({ error: "Could not load exceptions." }, { status: 500 });
    }
    for (const ex of (exceptions || []) as AvailabilityException[]) {
      const list = exceptionsByTutor.get(ex.tutor_id) ?? [];
      list.push(ex);
      exceptionsByTutor.set(ex.tutor_id, list);
    }
  }

  let slotsCreated = 0;
  const failures: Array<{ ruleId: string; error: string }> = [];
  for (const rule of activeRules) {
    const result = await syncRuleSlots(
      admin,
      rule,
      exceptionsByTutor.get(rule.tutor_id) ?? []
    );
    slotsCreated += result.slotsCreated;
    if (result.error) failures.push({ ruleId: rule.id, error: result.error });
  }

  const completion = await completeFinishedBookings(admin);
  if (completion.error) {
    failures.push({ ruleId: "complete-bookings", error: completion.error });
  }

  // WhatsApp inbound events are only needed for idempotency and debugging.
  const inboundCutoff = new Date(
    Date.now() - INBOUND_RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  const { error: purgeError } = await admin
    .from("wa_inbound_events")
    .delete()
    .lt("created_at", inboundCutoff);
  if (purgeError) {
    failures.push({ ruleId: "purge-wa-inbound", error: purgeError.message });
  }

  if (failures.length > 0) {
    console.error("[cron/daily] failures:", failures);
  }

  return noStoreJson(
    {
      ok: failures.length === 0,
      rules: activeRules.length,
      slotsCreated,
      bookingsCompleted: completion.bookingsCompleted,
      failures,
    },
    { status: failures.length === 0 ? 200 : 207 }
  );
}
