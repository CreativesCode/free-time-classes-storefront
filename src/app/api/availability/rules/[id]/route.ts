import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: ruleId } = await context.params;
    if (!ruleId || typeof ruleId !== "string") {
      return NextResponse.json({ error: "Invalid rule id." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("is_tutor")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.is_tutor) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env vars." },
        { status: 500 }
      );
    }

    const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: rule, error: ruleError } = await admin
      .from("tutor_availability")
      .select("id,tutor_id")
      .eq("id", ruleId)
      .single();

    if (ruleError || !rule || rule.tutor_id !== user.id) {
      return NextResponse.json({ error: "Rule not found." }, { status: 404 });
    }

    const { data: lessons, error: lessonsError } = await admin
      .from("lessons")
      .select("id")
      .eq("availability_rule_id", ruleId)
      .eq("status", "available");

    if (lessonsError) {
      return NextResponse.json(
        { error: "Could not load generated lessons." },
        { status: 400 }
      );
    }

    const lessonIds = (lessons || []).map((l) => l.id as number);

    if (lessonIds.length > 0) {
      const { data: bookings, error: bookingsError } = await admin
        .from("bookings")
        .select("lesson_id")
        .in("lesson_id", lessonIds)
        .in("status", ["pending", "confirmed"]);

      if (bookingsError) {
        return NextResponse.json(
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
          return NextResponse.json(
            { error: delErr.message || "Could not remove slots." },
            { status: 400 }
          );
        }
      }
    }

    const { error: delRuleErr } = await admin
      .from("tutor_availability")
      .delete()
      .eq("id", ruleId);

    if (delRuleErr) {
      return NextResponse.json(
        { error: delRuleErr.message || "Could not delete rule." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[availability/rules DELETE] error:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}