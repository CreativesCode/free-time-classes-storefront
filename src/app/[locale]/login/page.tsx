import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Suspense } from "react";

import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { createClient } from "@/lib/supabase/server";

import LoginClient from "./LoginClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return buildPageMetadata({
    locale,
    path: "/login",
    title: t("login.title"),
    description: t("login.description"),
    robots: { index: false, follow: true },
  });
}

export default async function LoginPage({
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

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginClient locale={locale} />
    </Suspense>
  );
}
