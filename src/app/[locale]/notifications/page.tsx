import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import NotificationsClient from "./NotificationsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return buildPageMetadata({
    locale,
    path: "/notifications",
    title: t("notifications.title"),
    description: t("notifications.description"),
    robots: { index: false, follow: false },
  });
}

export default function NotificationsPage() {
  return <NotificationsClient />;
}
