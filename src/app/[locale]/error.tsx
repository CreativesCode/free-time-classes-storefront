"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "@/i18n/translations";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    console.error("[locale/error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-[20px] font-semibold text-ft-ink">{t("title")}</h1>
      <p className="max-w-md text-[14px] text-ft-ink-2">{t("description")}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-ft-sm bg-ft-ink px-4 py-2 text-[13px] font-semibold text-ft-paper hover:opacity-90"
        >
          {t("retry")}
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-ft-sm border border-ft-line bg-ft-paper px-4 py-2 text-[13px] font-semibold text-ft-ink-2 hover:bg-ft-surface-1"
        >
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
