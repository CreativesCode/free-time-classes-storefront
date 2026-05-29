import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DEV-ONLY helper to register this app's webhook with the OpenWA session.
 *
 * Click-to-run (open in the logged-in browser):
 *   GET /api/dev/wa-register-webhook?url=https://<public-host>/api/wa-webhook
 *
 * `url` must be PUBLICLY reachable from the OpenWA server (use a tunnel in dev).
 * The secret is taken from OPENWA_WEBHOOK_SECRET so the webhook payloads are
 * HMAC-signed. Not available in production.
 */
const noStoreJson = (body: unknown, init?: ResponseInit) =>
  NextResponse.json(body, {
    ...init,
    headers: { ...(init?.headers ?? {}), "Cache-Control": "no-store" },
  });

export async function GET(request: NextRequest) {
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

  const baseUrl = process.env.OPENWA_BASE_URL ?? "";
  const apiKey = process.env.OPENWA_API_KEY ?? "";
  const sessionId = process.env.OPENWA_SESSION_ID ?? "";
  const secret = process.env.OPENWA_WEBHOOK_SECRET ?? "";

  if (!baseUrl || !apiKey || !sessionId) {
    return noStoreJson({ error: "Missing OPENWA_* env vars." }, { status: 500 });
  }

  const webhookUrl = request.nextUrl.searchParams.get("url")?.trim();
  if (!webhookUrl || !/^https?:\/\//i.test(webhookUrl)) {
    return noStoreJson(
      { error: "Provide a public 'url' query param, e.g. ?url=https://host/api/wa-webhook" },
      { status: 400 },
    );
  }

  if (!secret) {
    console.warn("[wa-register-webhook] OPENWA_WEBHOOK_SECRET is empty — payloads won't be HMAC-signed.");
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/sessions/${sessionId}/webhooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify({
        url: webhookUrl,
        events: ["message.received", "session.disconnected", "session.qr"],
        ...(secret ? { secret } : {}),
      }),
    });
  } catch (err) {
    return noStoreJson({ error: "Network error", details: String(err) }, { status: 502 });
  }

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text.slice(0, 500);
  }

  return noStoreJson(
    { ok: res.ok, status: res.status, registeredUrl: webhookUrl, signed: Boolean(secret), response: parsed },
    { status: res.ok ? 200 : 502 },
  );
}
