import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import ForgotPasswordClient from "./ForgotPasswordClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "passwordReset" });
  return { title: t("forgotTitle"), robots: { index: false, follow: false } };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  unstable_setRequestLocale(locale);
  return <ForgotPasswordClient locale={locale} />;
}
