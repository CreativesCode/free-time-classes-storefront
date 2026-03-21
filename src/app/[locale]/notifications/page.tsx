"use client";

import { useMemo, useState } from "react";
import { Bell, CalendarCheck2, CheckCircle2, Mail, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/translations";

type NotificationType = "message" | "booking" | "payment";

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  isNew?: boolean;
  ctaLabel?: string;
  secondaryCtaLabel?: string;
};

const groupedNotifications: Record<string, NotificationItem[]> = {
  today: [
    {
      id: "n1",
      type: "booking",
      title: "Booking Confirmed with Elena",
      description: "Your session is scheduled for tomorrow at 10:00 AM.",
      time: "2m",
      isNew: true,
      ctaLabel: "Add to calendar",
      secondaryCtaLabel: "Details",
    },
    {
      id: "n2",
      type: "message",
      title: "New message from Carlos",
      description: "I reviewed your latest draft. Great progress in chapter 3.",
      time: "45m",
      ctaLabel: "Reply now",
    },
  ],
  yesterday: [
    {
      id: "n3",
      type: "payment",
      title: "Payment successful",
      description: "Invoice #88291 has been processed successfully.",
      time: "1d",
      ctaLabel: "Download invoice",
    },
  ],
};

function IconByType({ type }: { type: NotificationType }) {
  if (type === "booking") return <CalendarCheck2 className="h-5 w-5" />;
  if (type === "payment") return <CheckCircle2 className="h-5 w-5" />;
  return <Mail className="h-5 w-5" />;
}

export default function NotificationsPage() {
  const t = useTranslations("notificationsPage");
  const [allRead, setAllRead] = useState(false);

  const notifications = useMemo(() => {
    if (!allRead) return groupedNotifications;
    return Object.fromEntries(
      Object.entries(groupedNotifications).map(([k, list]) => [
        k,
        list.map((item) => ({ ...item, isNew: false })),
      ]),
    );
  }, [allRead]);

  return (
    <div className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#fef3ff]">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-purple-300/20 blur-3xl" />

      <main className="relative mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 md:pt-8">
        <section className="mb-6 rounded-3xl border border-primary/10 bg-white/80 p-4 shadow-[0_20px_60px_-35px_rgba(112,42,225,0.45)] backdrop-blur-md sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                {t("badge")}
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
                {t("title")}
              </h1>
              <p className="max-w-xl text-sm text-zinc-600 sm:text-base">{t("subtitle")}</p>
            </div>

            <Button
              variant="ghost"
              className="w-full justify-center gap-2 text-primary hover:bg-primary/10 hover:text-primary md:w-auto"
              onClick={() => setAllRead(true)}
            >
              <Bell className="h-4 w-4" />
              {t("markAllAsRead")}
            </Button>
          </div>
        </section>

        <div className="space-y-7">
          {Object.entries(notifications).map(([group, items]) => (
            <section key={group} className="space-y-3">
              <h2 className="px-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                {group === "today" ? t("groupToday") : t("groupYesterday")}
              </h2>

              <div className="space-y-3">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className={cn(
                      "rounded-2xl border bg-white p-4 shadow-sm transition-all sm:p-5",
                      "md:hover:-translate-y-0.5 md:hover:shadow-md",
                      item.isNew ? "border-primary/25" : "border-zinc-100",
                    )}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div
                        className={cn(
                          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          item.type === "booking" && "bg-primary/10 text-primary",
                          item.type === "message" && "bg-violet-100 text-violet-700",
                          item.type === "payment" && "bg-emerald-100 text-emerald-700",
                        )}
                      >
                        <IconByType type={item.type} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-zinc-900 sm:text-lg">{item.title}</h3>
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                            {item.time}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-600 sm:text-[15px]">{item.description}</p>

                        {(item.ctaLabel || item.secondaryCtaLabel) && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {item.ctaLabel && (
                              <Button size="sm" className="rounded-full">
                                {item.ctaLabel}
                              </Button>
                            )}
                            {item.secondaryCtaLabel && (
                              <Button size="sm" variant="secondary" className="rounded-full">
                                {item.secondaryCtaLabel}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-3xl bg-gradient-to-br from-primary to-violet-700 p-6 text-white shadow-[0_24px_50px_-30px_rgba(112,42,225,0.8)] sm:p-8">
          <div className="max-w-sm space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">{t("promoTag")}</p>
            <h3 className="text-2xl font-extrabold leading-tight">{t("promoTitle")}</h3>
            <p className="text-sm text-white/80">{t("promoDescription")}</p>
            <Button
              variant="secondary"
              className="rounded-full bg-white text-primary hover:bg-white/90"
            >
              <ReceiptText className="mr-2 h-4 w-4" />
              {t("promoCta")}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
