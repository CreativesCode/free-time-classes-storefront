import type { Notification } from "@/types/notification";
import { createClient } from "../client";

const supabase = createClient();

/**
 * Fetch notifications for the current user, newest first.
 */
export async function getUserNotifications(
  userId: string,
  limit = 30,
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, body, data, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as Notification[];
}

/**
 * Count unread notifications for the current user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(
  notificationId: number,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}
