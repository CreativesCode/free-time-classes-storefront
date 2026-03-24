import { google } from "googleapis";
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

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
];

export function getGoogleAuthUrl(userId: string): string {
  const oAuth2Client = getOAuth2Client();
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: userId,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oAuth2Client = getOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
}

export async function saveGoogleTokens(
  userId: string,
  tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null; scope?: string | null }
) {
  const admin = getAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin
    .from("google_tokens")
    .upsert(
      {
        user_id: userId,
        access_token: tokens.access_token ?? "",
        refresh_token: tokens.refresh_token ?? "",
        token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : now,
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

async function getAuthenticatedClient(userId: string) {
  const stored = await getGoogleTokens(userId);
  if (!stored) return null;

  const oAuth2Client = getOAuth2Client();
  oAuth2Client.setCredentials({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
    expiry_date: new Date(stored.token_expiry).getTime(),
  });

  const isExpired = new Date(stored.token_expiry).getTime() < Date.now() + 60_000;
  if (isExpired && stored.refresh_token) {
    try {
      const { credentials } = await oAuth2Client.refreshAccessToken();
      await saveGoogleTokens(userId, credentials);
      oAuth2Client.setCredentials(credentials);
    } catch (err) {
      console.error("[google-calendar] Failed to refresh token:", err);
      await deleteGoogleTokens(userId);
      return null;
    }
  }

  return oAuth2Client;
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
  const auth = await getAuthenticatedClient(params.tutorId);
  if (!auth) return null;

  const calendar = google.calendar({ version: "v3", auth });
  const start = new Date(params.startTime);
  const end = new Date(start.getTime() + params.durationMinutes * 60_000);

  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: {
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
    },
  });

  const meetLink =
    event.data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video"
    )?.uri ?? event.data.hangoutLink ?? "";

  return {
    eventId: event.data.id ?? "",
    meetLink,
    htmlLink: event.data.htmlLink ?? "",
  };
}

export async function deleteMeetEvent(
  tutorId: string,
  eventId: string
): Promise<boolean> {
  const auth = await getAuthenticatedClient(tutorId);
  if (!auth) return false;

  const calendar = google.calendar({ version: "v3", auth });

  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId,
      sendUpdates: "all",
    });
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
