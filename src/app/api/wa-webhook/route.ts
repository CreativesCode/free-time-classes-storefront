import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { verifySignature } from "@/lib/whatsapp/verifySignature";
import { parseReply } from "@/lib/whatsapp/parseReply";
import { matchPendingBooking } from "@/lib/whatsapp/matchBooking";
import { respondToBooking } from "@/lib/bookings/respond";
import { isOpenWaConfigured, sendText } from "@/lib/whatsapp/openwa";

// node:crypto (HMAC) needs the Node runtime, not edge.
export const runtime = "nodejs";

const WEBHOOK_SECRET = process.env.OPENWA_WEBHOOK_SECRET ?? "";

const isBogusKey = (k?: string | null) => !k || k === "msg_unknown" || k === "unknown";

function adminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  // Read the RAW body — HMAC must be verified against it, not re-serialized JSON.
  const rawBody = await request.text();

  // 1. Signature (when a secret is configured)
  if (WEBHOOK_SECRET) {
    const ok = verifySignature(
      rawBody,
      request.headers.get("x-openwa-signature"),
      WEBHOOK_SECRET,
    );
    if (!ok) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let env: Record<string, unknown>;
  try {
    env = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = (env.data ?? {}) as Record<string, unknown>;
  const event = String(env.event ?? "");

  const admin = adminClient();
  if (!admin) {
    // Tell OpenWA to retry — this is a server-side misconfig, not a bad event.
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Non-message events we care about
  if (event === "session.disconnected") {
    console.error("[wa-webhook] session.disconnected:", env.sessionId);
    return NextResponse.json({ ok: true, handled: "session.disconnected" });
  }
  if (event !== "message.received") {
    return NextResponse.json({ ok: true, skip: "event" });
  }

  // 2. Filter non-chat / echoes / groups / empty bodies (guide §5.6)
  const body = typeof data.body === "string" ? data.body : "";
  const type = typeof data.type === "string" ? data.type : "";
  if (data.fromMe === true || data.isGroup === true) {
    return NextResponse.json({ ok: true, skip: "echo_or_group" });
  }
  if (type && type !== "chat") {
    return NextResponse.json({ ok: true, skip: "non_chat" });
  }
  if (!body.trim()) {
    return NextResponse.json({ ok: true, skip: "empty" });
  }

  // 3. Idempotency — build our own key (guide §5.5) and dedup atomically via
  // the unique constraint on wa_inbound_events.idempotency_key.
  const headerKey = request.headers.get("x-openwa-idempotency-key");
  const dataId = typeof data.id === "string" ? data.id : "";
  const deliveryId = typeof env.deliveryId === "string" ? env.deliveryId : "";
  const idemKey = !isBogusKey(headerKey)
    ? (headerKey as string)
    : !isBogusKey(env.idempotencyKey as string)
      ? (env.idempotencyKey as string)
      : dataId
        ? `msgid:${dataId}`
        : `dlv:${deliveryId}`;

  const from = typeof data.from === "string" ? data.from : "";

  const { error: insertError } = await admin
    .from("wa_inbound_events")
    .insert({ idempotency_key: idemKey, from_id: from, body });

  if (insertError) {
    // 23505 = unique_violation → already processed this event.
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("[wa-webhook] inbound insert failed:", insertError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // 4. Resolve which pending booking this reply refers to (handles @lid)
  const match = await matchPendingBooking(admin, from);
  if (!match) {
    await admin
      .from("wa_inbound_events")
      .update({ action: "no_match" })
      .eq("idempotency_key", idemKey);
    return NextResponse.json({ ok: true, skip: "no_match" });
  }

  // 5. Parse the reply into an action
  const action = parseReply(body);
  if (!action) {
    await admin
      .from("wa_inbound_events")
      .update({ action: "unrecognized", booking_id: match.bookingId })
      .eq("idempotency_key", idemKey);
    if (from && isOpenWaConfigured()) {
      await sendText(
        from,
        "No entendí tu respuesta. Responde *SÍ* para confirmar o *NO* para rechazar la solicitud.",
      ).catch(() => {});
    }
    return NextResponse.json({ ok: true, skip: "unrecognized" });
  }

  // 6. Act on the booking (reuses the same logic as the tutor API route)
  const result = await respondToBooking(admin, {
    bookingId: match.bookingId,
    tutorId: match.tutorId,
    action,
  });

  await admin
    .from("wa_inbound_events")
    .update({ action, booking_id: match.bookingId })
    .eq("idempotency_key", idemKey);

  // 7. Confirmation back to the tutor (reply to the same chat)
  if (from && isOpenWaConfigured()) {
    let reply: string;
    if (result.httpStatus === 200 && action === "confirm") {
      const meetLink =
        typeof result.payload.meetLink === "string" ? result.payload.meetLink : "";
      reply = meetLink
        ? `✅ Clase confirmada. Enlace de la videollamada:\n${meetLink}`
        : "✅ Clase confirmada.";
    } else if (result.httpStatus === 200) {
      reply = "❌ Solicitud rechazada.";
    } else if (result.payload.code === "request_expired") {
      reply = "⌛ Esta solicitud ya había caducado.";
    } else if (result.httpStatus === 409) {
      reply = "Esta solicitud ya no está pendiente.";
    } else {
      reply = "No se pudo procesar la solicitud. Inténtalo desde la app.";
    }
    await sendText(from, reply).catch(() => {});
  }

  return NextResponse.json({ ok: true, action, bookingId: match.bookingId });
}
