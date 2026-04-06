import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import AuthCallbackClient from "./AuthCallbackClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return buildPageMetadata({
    locale,
    path: "/auth/callback",
    title: t("authCallback.title"),
    description: t("authCallback.description"),
    robots: { index: false, follow: false },
  });
}

export default async function AuthCallbackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <Suspense fallback={null}>
      <AuthCallbackClient locale={locale} />
    </Suspense>
  );
}
