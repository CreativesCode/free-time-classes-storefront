"use client";

import TutorCoursesManager from "@/components/teacher/TutorCoursesManager";
import { useAuth } from "@/context/UserContext";
import { useLocale } from "@/i18n/translations";
import { useTranslations } from "@/i18n/translations";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TutorCoursesCreatePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("teacherProfile.coursesManager");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [isLoading, user, router, locale]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-primary-800 mb-6">{t("title")}</h1>
      <TutorCoursesManager tutorId={user.id} />
    </div>
  );
}

