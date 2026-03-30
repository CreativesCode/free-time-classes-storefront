import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createSupabaseAdminClient(url, key, { auth: { persistSession: false } });
}

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google OAuth env vars (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)");
  }

  return { clientId, clientSecret, redirectUri };
}

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
];

export function getGoogleAuthUrl(userId: string): string {
  const { clientId, redirectUri } = getOAuth2Client();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES.join(" "),
    state: userId,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const { clientId, clientSecret, redirectUri } = getOAuth2Client();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange OAuth code: ${response.status} ${errorText}`);
  }

  return (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expiry_date?: number;
    expires_in?: number;
    scope?: string;
  };
}

export async function saveGoogleTokens(
  userId: string,
  tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    expiry_date?: number | null;
    expires_in?: number | null;
    scope?: string | null;
  }
) {
  const admin = getAdminClient();
  const now = new Date().toISOString();
  const calculatedExpiryIso =
    tokens.expiry_date != null
      ? new Date(tokens.expiry_date).toISOString()
      : tokens.expires_in != null
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : now;

  const { error } = await admin
    .from("google_tokens")
    .upsert(
      {
        user_id: userId,
        access_token: tokens.access_token ?? "",
        refresh_token: tokens.refresh_token ?? "",
        token_expiry: calculatedExpiryIso,
        scope: tokens.scope ?? SCOPES.join(" "),
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

  if (error) throw error;
}

export async function getGoogleTokens(userId: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("google_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as {
    user_id: string;
    access_token: string;
    refresh_token: string;
    token_expiry: string;
    scope: string | null;
  };
}

export async function deleteGoogleTokens(userId: string) {
  const admin = getAdminClient();
  await admin.from("google_tokens").delete().eq("user_id", userId);
}

async function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getOAuth2Client();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh Google access token: ${response.status} ${errorText}`);
  }

  return (await response.json()) as {
    access_token: string;
    expires_in?: number;
    scope?: string;
  };
}

async function getValidAccessToken(userId: string) {
  const stored = await getGoogleTokens(userId);
  if (!stored) return null;

  const isExpired = new Date(stored.token_expiry).getTime() < Date.now() + 60_000;
  if (isExpired && stored.refresh_token) {
    try {
      const refreshed = await refreshAccessToken(stored.refresh_token);
      const expiryDate = Date.now() + (refreshed.expires_in ?? 3600) * 1000;
      await saveGoogleTokens(userId, {
        access_token: refreshed.access_token,
        refresh_token: stored.refresh_token,
        expiry_date: expiryDate,
        scope: refreshed.scope ?? stored.scope ?? SCOPES.join(" "),
      });
      return refreshed.access_token;
    } catch (err) {
      console.error("[google-calendar] Failed to refresh token:", err);
      await deleteGoogleTokens(userId);
      return null;
    }
  }

  return stored.access_token;
}

export interface CreateMeetEventParams {
  tutorId: string;
  summary: string;
  description?: string;
  startTime: string;
  durationMinutes: number;
  attendeeEmails: string[];
}

export interface MeetEventResult {
  eventId: string;
  meetLink: string;
  htmlLink: string;
}

export async function createMeetEvent(
  params: CreateMeetEventParams
): Promise<MeetEventResult | null> {
  const accessToken = await getValidAccessToken(params.tutorId);
  if (!accessToken) return null;
  const start = new Date(params.startTime);
  const end = new Date(start.getTime() + params.durationMinutes * 60_000);

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: params.summary,
        description: params.description ?? "",
        start: {
          dateTime: start.toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: "UTC",
        },
        attendees: params.attendeeEmails.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `ftc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[google-calendar] Failed to create event:", response.status, errorText);
    return null;
  }

  const event = (await response.json()) as {
    id?: string;
    hangoutLink?: string;
    htmlLink?: string;
    conferenceData?: { entryPoints?: Array<{ entryPointType?: string; uri?: string }> };
  };

  const meetLink =
    event.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video"
    )?.uri ?? event.hangoutLink ?? "";

  return {
    eventId: event.id ?? "",
    meetLink,
    htmlLink: event.htmlLink ?? "",
  };
}

export async function deleteMeetEvent(
  tutorId: string,
  eventId: string
): Promise<boolean> {
  const accessToken = await getValidAccessToken(tutorId);
  if (!accessToken) return false;

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      console.error("[google-calendar] Failed to delete event:", response.status, errorText);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[google-calendar] Failed to delete event:", err);
    return false;
  }
}

export async function hasGoogleConnection(userId: string): Promise<boolean> {
  const tokens = await getGoogleTokens(userId);
  return tokens !== null;
}
