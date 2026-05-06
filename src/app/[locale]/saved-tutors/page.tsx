import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import SavedTutorsClient from "./SavedTutorsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return buildPageMetadata({
    locale,
    path: "/saved-tutors",
    title: t("savedTutors.title"),
    description: t("savedTutors.description"),
    robots: { index: false, follow: false },
  });
}

export default async function SavedTutorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <SavedTutorsClient locale={locale} />;
}
