import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return buildPageMetadata({
    locale,
    path: "/student/profile",
    title: t("studentProfileRedirect.title"),
    description: t("studentProfileRedirect.description"),
    robots: { index: false, follow: true },
  });
}

export default async function StudentProfileLegacyRedirect({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const q = await searchParams;
  const tab = typeof q.tab === "string" ? q.tab : undefined;
  const suffix = tab ? `?tab=${encodeURIComponent(tab)}` : "";
  redirect(`/${locale}/student-profile${suffix}`);
}
