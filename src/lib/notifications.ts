import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationType } from "@/types/notification";

/**
 * Insert a notification using a Supabase admin client (service role).
 * Call this from API routes after booking events.
 */
export async function insertNotification(
  admin: SupabaseClient,
  params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  },
): Promise<void> {
  const row = {
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    data: params.data ?? {},
  };

  console.log("[insertNotification] inserting:", JSON.stringify(row));

  const { data, error } = await admin
    .from("notifications")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("[insertNotification] FAILED:", error.code, error.message, error.details);
  } else {
    console.log("[insertNotification] OK, id:", data?.id);
  }
}
