import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import ResetPasswordClient from "./ResetPasswordClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "passwordReset" });
  return { title: t("resetTitle"), robots: { index: false, follow: false } };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  unstable_setRequestLocale(locale);
  return <ResetPasswordClient locale={locale} />;
}
