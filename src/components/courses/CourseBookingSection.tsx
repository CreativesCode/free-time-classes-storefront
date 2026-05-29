"use client";

import AvailabilityBrowser from "@/components/student/AvailabilityBrowser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/UserContext";
import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function CourseBookingSection({
  locale,
  coursePath,
  tutorId,
  subjectId,
}: {
  locale: string;
  /** Path without hash, e.g. /es/courses/uuid */
  coursePath: string;
  tutorId: string;
  subjectId: number | null | undefined;
}) {
  const { user, isLoading } = useAuth();
  const t = useTranslations("courseDetail");

  const loginHref = `/${locale}/login?next=${encodeURIComponent(`${coursePath}#course-booking`)}`;

  if (isLoading) {
    return (
      <section
        id="course-booking"
        data-course-booking
        className="scroll-mt-28 rounded-ft-lg border border-ft-line bg-ft-paper p-10 shadow-none"
      >
        <div className="mx-auto flex h-12 w-12 animate-spin rounded-full border-4 border-ft-line border-t-ft-accent" />
      </section>
    );
  }

  if (!user) {
    return (
      <section
        id="course-booking"
        data-course-booking
        className="scroll-mt-28"
      >
        <Card className="rounded-ft-lg border-ft-line bg-ft-paper shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold md:text-xl text-ft-ink">
              <Calendar className="h-5 w-5 text-ft-accent-deep" />
              {t("bookingSectionTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-slate-600 md:text-base">
              {t("bookingLoginPrompt")}
            </p>
            <Button asChild className="rounded-full font-semibold">
              <Link href={loginHref}>{t("bookingLoginCta")}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!user.is_student) {
    return (
      <section
        id="course-booking"
        data-course-booking
        className="scroll-mt-28"
      >
        <Card className="rounded-ft-lg border-ft-line bg-ft-paper shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold md:text-xl text-ft-ink">
              <Calendar className="h-5 w-5 text-ft-accent-deep" />
              {t("bookingSectionTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-slate-600 md:text-base">
              {t("bookingStudentsOnly")}
            </p>
            {user.is_tutor ? (
              <Button asChild variant="outline" className="rounded-full">
                <Link href={`/${locale}/teacher-profile`}>{t("bookingTeacherAreaCta")}</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section id="course-booking" data-course-booking className="scroll-mt-28 space-y-3">
      <p className="text-sm text-slate-600 md:text-base">{t("bookingSectionSubtitle")}</p>
      <AvailabilityBrowser
        fixedTutorId={tutorId}
        initialSubjectId={subjectId ?? null}
        scopeToCourse
        listTitle={t("bookingSectionTitle")}
      />
    </section>
  );
}
