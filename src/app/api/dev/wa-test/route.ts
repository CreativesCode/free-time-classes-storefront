import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isOpenWaConfigured, phoneToChatId, sendText } from "@/lib/whatsapp/openwa";
import { buildWhatsAppMessage } from "@/lib/whatsapp/messages";

/**
 * DEV-ONLY smoke test for the outbound WhatsApp path.
 *
 * Click-to-test (open in the logged-in browser):
 *   GET /api/dev/wa-test?phone=+34600111222
 * Or via POST: { "phone": "+34600111222", "text"?: "..." }
 *
 * Sends a single message straight through the OpenWA client — bypassing the
 * notifications table and the booking flow — so you can validate env config,
 * base path and message formatting in isolation. Not available in production.
 */
const noStoreJson = (body: unknown, init?: ResponseInit) =>
  NextResponse.json(body, {
    ...init,
    headers: { ...(init?.headers ?? {}), "Cache-Control": "no-store" },
  });

async function sendTest(phoneRaw: string, customText?: string) {
  const phone = phoneRaw.trim();
  if (!phone) {
    return noStoreJson(
      { error: "Provide a 'phone' in international format (+34...)." },
      { status: 400 }
    );
  }

  const chatId = phoneToChatId(phone);
  const text =
    customText?.trim() ||
    buildWhatsAppMessage({
      type: "booking_confirmed",
      title: "Prueba de WhatsApp",
      body: "Si recibes esto, la integración con OpenWA funciona ✅",
      data: {
        scheduled_date_time: "2026-06-15T14:30:00",
        meet_link: "https://meet.google.com/test-test-test",
      },
    });

  const result = await sendText(chatId, text);

  return noStoreJson(
    {
      ok: result.success,
      chatId,
      messageId: result.success ? (result.data?.messageId ?? null) : null,
      error: result.success ? null : result.error,
    },
    { status: result.success ? 200 : 502 }
  );
}

async function guard() {
  if (process.env.NODE_ENV === "production") {
    return noStoreJson({ error: "Not available in production." }, { status: 404 });
  }
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return noStoreJson({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isOpenWaConfigured()) {
    return noStoreJson(
      { error: "OpenWA is not configured (missing OPENWA_* env vars)." },
      { status: 500 }
    );
  }
  return null;
}

export async function GET(request: NextRequest) {
  const blocked = await guard();
  if (blocked) return blocked;
  const phone = request.nextUrl.searchParams.get("phone") ?? "";
  const text = request.nextUrl.searchParams.get("text") ?? undefined;
  return sendTest(phone, text);
}

export async function POST(request: NextRequest) {
  const blocked = await guard();
  if (blocked) return blocked;
  const body = (await request.json().catch(() => ({}))) as {
    phone?: string;
    text?: string;
  };
  return sendTest(body.phone ?? "", body.text);
}
