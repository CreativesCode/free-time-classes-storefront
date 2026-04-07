"use client";

import { useMemo } from "react";
import {
  Bell,
  CalendarCheck2,
  CalendarPlus,
  CalendarX2,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "@/i18n/translations";
import { useAuth } from "@/context/UserContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import type { Notification, NotificationType } from "@/types/notification";

function IconByType({ type }: { type: NotificationType }) {
  switch (type) {
    case "booking_request":
      return <CalendarPlus className="h-5 w-5" />;
    case "booking_confirmed":
      return <CalendarCheck2 className="h-5 w-5" />;
    case "booking_rejected":
      return <XCircle className="h-5 w-5" />;
    case "booking_cancelled":
      return <CalendarX2 className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
}

function iconColor(type: NotificationType) {
  switch (type) {
    case "booking_request":
      return "bg-blue-100 text-blue-600";
    case "booking_confirmed":
      return "bg-emerald-100 text-emerald-600";
    case "booking_rejected":
      return "bg-red-100 text-red-500";
    case "booking_cancelled":
      return "bg-amber-100 text-amber-600";
    default:
      return "bg-primary/10 text-primary";
  }
}

function borderColor(type: NotificationType) {
  switch (type) {
    case "booking_request":
      return "border-l-blue-500";
    case "booking_confirmed":
      return "border-l-emerald-500";
    case "booking_rejected":
      return "border-l-red-400";
    case "booking_cancelled":
      return "border-l-amber-400";
    default:
      return "border-l-primary";
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function getNotificationHref(n: Notification, locale: string): string {
  switch (n.type) {
    case "booking_request":
      return `/${locale}/tutor/dashboard`;
    case "booking_confirmed":
    case "booking_rejected":
    case "booking_cancelled":
      return `/${locale}/bookings`;
    default:
      return `/${locale}/notifications`;
  }
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function NotificationsClient() {
  const t = useTranslations("notificationsPage");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotifications(
    user?.id,
  );

  const grouped = useMemo(() => {
    const today: typeof notifications = [];
    const earlier: typeof notifications = [];
    for (const n of notifications) {
      if (isToday(n.created_at)) {
        today.push(n);
      } else {
        earlier.push(n);
      }
    }
    return { today, earlier };
  }, [notifications]);

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#fef3ff] dark:bg-background">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-purple-300/20 blur-3xl" />

      <main className="relative mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 md:pt-8 lg:pt-10">
        {/* Header */}
        <section className="mb-6 rounded-3xl border border-primary/10 bg-white/80 p-4 shadow-[0_20px_60px_-35px_rgba(112,42,225,0.45)] backdrop-blur-md sm:p-6 lg:mb-8 dark:bg-card/80">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                {t("badge")}
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl lg:text-5xl dark:text-foreground">
                {t("title")}
              </h1>
              <p className="max-w-xl text-sm text-zinc-600 sm:text-base dark:text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>

            {hasUnread && (
              <Button
                variant="ghost"
                className="w-full justify-center gap-2 text-primary hover:bg-primary/10 hover:text-primary md:w-auto"
                onClick={() => markAllAsRead()}
              >
                <Bell className="h-4 w-4" />
                {t("markAllAsRead")}
              </Button>
            )}
          </div>
        </section>

        {/* Notification list */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-8 w-8 text-primary/40" />
            </div>
            <p className="text-lg font-semibold text-zinc-700 dark:text-foreground">
              {t("empty")}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-muted-foreground">
              {t("emptySubtitle")}
            </p>
          </div>
        ) : (
          <div className="space-y-7">
            {grouped.today.length > 0 && (
              <section className="space-y-3">
                <h2 className="px-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                  {t("groupToday")}
                </h2>
                <div className="space-y-3">
                  {grouped.today.map((item) => (
                    <NotificationCard
                      key={item.id}
                      item={item}
                      locale={locale}
                      onMarkRead={markAsRead}
                      onNavigate={(href) => router.push(href)}
                    />
                  ))}
                </div>
              </section>
            )}

            {grouped.earlier.length > 0 && (
              <section className="space-y-3">
                <h2 className="px-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                  {t("groupEarlier")}
                </h2>
                <div className="space-y-3">
                  {grouped.earlier.map((item) => (
                    <NotificationCard
                      key={item.id}
                      item={item}
                      locale={locale}
                      onMarkRead={markAsRead}
                      onNavigate={(href) => router.push(href)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="mt-8 flex flex-col items-center justify-center py-3 text-center md:mt-10">
            <div className="mb-2 h-10 w-px bg-gradient-to-b from-primary/60 to-transparent" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              {t("endOfList")}
            </p>
          </div>
        )}

        {/* Promo */}
        <section className="mt-8 rounded-3xl bg-gradient-to-br from-primary to-violet-700 p-6 text-white shadow-[0_24px_50px_-30px_rgba(112,42,225,0.8)] sm:p-8">
          <div className="max-w-sm space-y-3 md:max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
              {t("promoTag")}
            </p>
            <h3 className="text-2xl font-extrabold leading-tight">
              {t("promoTitle")}
            </h3>
            <p className="text-sm text-white/80">{t("promoDescription")}</p>
            <Button
              variant="secondary"
              className="rounded-full bg-white text-primary hover:bg-white/90"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {t("promoCta")}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

function NotificationCard({
  item,
  locale,
  onMarkRead,
  onNavigate,
}: {
  item: Notification;
  locale: string;
  onMarkRead: (id: number) => void;
  onNavigate: (href: string) => void;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border-l-4 border bg-white p-4 shadow-sm transition-all sm:p-5 lg:p-6 dark:bg-card",
        "md:hover:-translate-y-0.5 md:hover:shadow-md cursor-pointer",
        borderColor(item.type),
        !item.is_read ? "border-primary/25" : "border-zinc-100 dark:border-border",
      )}
      onClick={() => {
        if (!item.is_read) onMarkRead(item.id);
        onNavigate(getNotificationHref(item, locale));
      }}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={cn(
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            iconColor(item.type),
          )}
        >
          <IconByType type={item.type} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              className={cn(
                "text-base sm:text-lg dark:text-foreground",
                !item.is_read
                  ? "font-bold text-zinc-900"
                  : "font-semibold text-zinc-700",
              )}
            >
              {item.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-muted dark:text-muted-foreground">
                {timeAgo(item.created_at)}
              </span>
              {!item.is_read && (
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </div>
          </div>
          {item.body && (
            <p className="mt-1 text-sm leading-relaxed text-zinc-600 sm:text-[15px] dark:text-muted-foreground">
              {item.body}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
