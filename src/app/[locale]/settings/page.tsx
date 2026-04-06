import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import SettingsClient from "./SettingsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return buildPageMetadata({
    locale,
    path: "/settings",
    title: t("settings.title"),
    description: t("settings.description"),
    robots: { index: false, follow: false },
  });
}

function SettingsFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsClient locale={locale} />
    </Suspense>
  );
}
