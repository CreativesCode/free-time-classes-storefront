"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/context/UserContext";
import { useNotifications } from "@/hooks/useNotifications";

type NotificationsContextValue = ReturnType<typeof useNotifications>;

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/**
 * Single source of notifications for the whole shell: one fetch and one
 * realtime channel per session, shared by the navbar badge, the dashboard
 * bell, the notifications page and screens that react to booking events.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const value = useNotifications(user?.id);
  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotificationsContext must be used inside NotificationsProvider");
  }
  return ctx;
}
