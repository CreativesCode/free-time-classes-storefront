import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

import LoginClient from "./LoginClient";

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
    redirect(`/${locale}/student-profile`);
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
