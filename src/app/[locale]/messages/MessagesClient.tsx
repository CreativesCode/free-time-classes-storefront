"use client";

import InternalMessagingPanel from "@/components/messages/InternalMessagingPanel";
import { useTranslations } from "@/i18n/translations";
import { MessageSquare } from "lucide-react";

export default function MessagesClient() {
  const t = useTranslations("messagesPage");

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gradient-to-b from-violet-50 via-[#fcf8ff] to-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3 rounded-3xl border border-violet-100 bg-white/70 px-4 py-4 backdrop-blur md:mb-8 md:px-6 md:py-5">
          <MessageSquare className="h-6 w-6 text-violet-600" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-violet-950 md:hidden">
              {t("title")}
            </h1>
            <h1 className="hidden text-3xl font-black tracking-tight text-violet-950 md:block lg:text-4xl">
              {t("title")}
            </h1>
            <p className="text-sm text-violet-500">{t("subtitle")}</p>
          </div>
          <span className="ml-auto hidden rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600 md:inline-flex">
            Mensajeria activa
          </span>
        </div>

        <InternalMessagingPanel namespace="messagesPage" />
      </div>
    </div>
  );
}
