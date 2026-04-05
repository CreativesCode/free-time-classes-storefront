import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import RegisterClient from "./RegisterClient";

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
