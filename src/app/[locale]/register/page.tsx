import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { createClient } from "@/lib/supabase/server";

import RegisterClient from "./RegisterClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return buildPageMetadata({
    locale,
    path: "/register",
    title: t("register.title"),
    description: t("register.description"),
    robots: { index: false, follow: true },
  });
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("is_student, is_tutor")
      .eq("id", user.id)
      .single();

    if (profile?.is_student && profile?.is_tutor) {
      redirect(`/${locale}/dashboard`);
    }
    if (profile?.is_tutor) {
      redirect(`/${locale}/teacher-profile`);
    }
    redirect(`/${locale}/dashboard`);
  }

  return <RegisterClient locale={locale} />;
}
