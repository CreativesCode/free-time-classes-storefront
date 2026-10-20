"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Notification } from "@/types/notification";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Loading is derived from which user the list belongs to, so the first render
  // after sign-in never shows an empty list as loaded (F099).
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const loading = !!userId && loadedUserId !== userId;
  // Most recent notification received through realtime (lets screens react
  // to new booking events without polling).
  const [latest, setLatest] = useState<Notification | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, user_id, type, title, body, data, is_read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      const items = (data ?? []) as Notification[];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error("[useNotifications] fetch error:", err);
    } finally {
      setLoadedUserId(userId);
    }
  }, [userId]);

  // Subscribe to realtime inserts for this user
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    // Remove any previous channel before creating a new one
    // (handles React Strict Mode double-mount)
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `notifications:${userId}:${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
          setLatest(newNotif);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, fetchNotifications]);

  // Mark single notification as read (optimistic)
  const markAsRead = useCallback(
    async (notificationId: number) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", userId!);
    },
    [userId],
  );

  // Mark all as read (optimistic)
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId!)
      .eq("is_read", false);
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    latest,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
