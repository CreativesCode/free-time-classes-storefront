import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { createClient } from "@/lib/supabase/server";
import type { StudentProfile } from "@/types/student";

import StudentProfilePageClient, {
  type StudentProfilePageUser,
} from "./StudentProfilePageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return buildPageMetadata({
    locale,
    path: "/student-profile",
    title: t("studentProfile.title"),
    description: t("studentProfile.description"),
    robots: { index: false, follow: false },
  });
}

function StudentProfileFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect(`/${locale}/login`);
  }

  const { data: userRow, error: userRowError } = await supabase
    .from("users")
    .select(
      "id, username, email, phone, country, profile_picture, is_student, created_at, updated_at"
    )
    .eq("id", authUser.id)
    .single();

  if (userRowError || !userRow) {
    redirect(`/${locale}/login`);
  }

  if (!userRow.is_student) {
    redirect(`/${locale}/dashboard`);
  }

  const pageUser: StudentProfilePageUser = {
    id: userRow.id,
    username: userRow.username,
    email: userRow.email,
    phone: userRow.phone ?? null,
    country: userRow.country ?? null,
    profile_picture: userRow.profile_picture ?? null,
    created_at: userRow.created_at,
    updated_at: userRow.updated_at,
  };

  const { data: profileRow, error: profileError } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) {
    console.error("student_profiles fetch:", profileError);
  }

  const initialStudentProfile = (profileRow as StudentProfile | null) ?? null;

  return (
    <Suspense fallback={<StudentProfileFallback />}>
      <StudentProfilePageClient
        locale={locale}
        pageUser={pageUser}
        initialStudentProfile={initialStudentProfile}
      />
    </Suspense>
  );
}
