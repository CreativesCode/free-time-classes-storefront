"use client";

import { useAuth } from "@/context/UserContext";
import { useTranslations, useLocale } from "@/i18n/translations";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import InternalMessagingPanel from "@/components/messages/InternalMessagingPanel";

export default function MessagesPage() {
  const { user, isLoading } = useAuth();
  const t = useTranslations("messagesPage");
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/${locale}/login`);
    }
  }, [isLoading, user, router, locale]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gray-50/50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>

        <InternalMessagingPanel namespace="messagesPage" />
      </div>
    </div>
  );
}
