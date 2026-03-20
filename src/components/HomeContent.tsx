"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useApp } from "@/context/AppContext";
import {
  getTutorProfileWithUser,
  getTutorSubjectDetails,
} from "@/lib/supabase/queries/tutors";
import type { CourseWithRelations } from "@/types/course";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// Función auxiliar para generar colores de avatar
function getAvatarColor(letter: string) {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEEAD",
    "#D4A5A5",
    "#9B59B6",
    "#3498DB",
  ];
  const index = letter.charCodeAt(0) % colors.length;
  return colors[index];
}

type FeaturedTeacher = {
  id: string;
  name: string;
  specialty: string;
  yearsOfExperience: number;
  coursesCount: number;
  profilePicture: string;
};

export default function HomeContent() {
  const t = useTranslations("home");
  const locale = useLocale();

  const { courses, refreshCourses } = useApp();
  const [featuredTeachers, setFeaturedTeachers] = useState<FeaturedTeacher[]>(
    []
  );
  const [, setFeaturedLoading] = useState(false);

  // Populate HomeContent from Supabase.
  useEffect(() => {
    refreshCourses({ is_active: true });
  }, [refreshCourses]);

  const popularCourses = useMemo(() => {
    const data = courses.data ?? [];

    const mapCourseLevelLabel = (
      level: CourseWithRelations["level"] | null | undefined
    ) => {
      if (level === "advanced") return t("advanced");
      if (level === "intermediate") return t("intermediate");
      return level ?? "";
    };

    return data.slice(0, 3).map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      teacher: course.tutor?.username ?? "—",
      level: mapCourseLevelLabel(course.level),
      students: course.enrolled_students_count ?? course.max_students ?? 0,
    }));
  }, [courses.data, t]);

  const tutorIds = useMemo(() => {
    const ids: string[] = [];
    for (const course of courses.data ?? []) {
      const tutorId = course.tutor?.id;
      if (!tutorId) continue;
      if (ids.includes(tutorId)) continue;
      ids.push(tutorId);
      if (ids.length >= 3) break;
    }
    return ids;
  }, [courses.data]);

  useEffect(() => {
    let cancelled = false;

    async function loadFeaturedTeachers() {
      if (tutorIds.length === 0) {
        setFeaturedTeachers([]);
        return;
      }

      setFeaturedLoading(true);
      try {
        const data = await Promise.all(
          tutorIds.map(async (tutorId) => {
            const [profile, subjects] = await Promise.all([
              getTutorProfileWithUser(tutorId),
              getTutorSubjectDetails(tutorId),
            ]);

            const name = profile?.user.username ?? "Profesor";
            const yearsOfExperience = profile?.years_of_experience ?? 0;
            const specialty = subjects?.[0]?.name ?? "—";
            const profilePicture =
              profile?.user.profile_picture ?? "/images/default-avatar.png";

            const coursesCount = (courses.data ?? []).filter(
              (c) => c.tutor?.id === tutorId
            ).length;

            return {
              id: tutorId,
              name,
              specialty,
              yearsOfExperience,
              coursesCount,
              profilePicture,
            } satisfies FeaturedTeacher;
          })
        );

        if (!cancelled) {
          setFeaturedTeachers(data);
        }
      } finally {
        if (!cancelled) setFeaturedLoading(false);
      }
    }

    void loadFeaturedTeachers();

    return () => {
      cancelled = true;
    };
  }, [tutorIds, courses.data]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gray-100 bg-[url('/images/bg.webp')] bg-cover bg-center bg-no-repeat text-white">
        <div className="px-4 sm:px-6 lg:px-8 h-full bg-black/15 rounded-lg py-20">
          <div className="max-w-7xl mx-auto text-center p-8 rounded-lg">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-shadow-lg">
              {t("heroTitle")}
            </h1>
            <p className="text-xl mb-8 text-shadow-lg">
              {t("heroDescription")}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href={`/${locale}/register`}>
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-secondary-700"
                >
                  {t("startNow")}
                </Button>
              </Link>
              <Link href={`/${locale}/tutors`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-primary-100 text-secondary-700"
                >
                  {t("findTutors")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Teachers Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("featuredTeachersTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTeachers.map((teacher) => {
              const firstChar = teacher.name?.[0] ?? "P";

              return (
                <Card
                  key={teacher.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={teacher.profilePicture}
                          alt={teacher.name}
                        />
                        <AvatarFallback
                          className="text-white"
                          style={{
                            backgroundColor: getAvatarColor(firstChar),
                          }}
                        >
                          {firstChar.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{teacher.name}</h3>
                        <p className="text-gray-600">{teacher.specialty}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Badge variant="secondary">
                        {teacher.yearsOfExperience} {t("years")}
                      </Badge>
                      <Badge variant="secondary">
                        {teacher.coursesCount} {t("coursesText")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("popularCoursesTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularCourses.map((course) => (
              <Link key={course.id} href={`/${locale}/courses/${course.id}`} className="block">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        {t("teacher")}: {course.teacher}
                      </p>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">{course.level}</Badge>
                        <span className="text-sm text-gray-600">
                          {course.students} {t("students")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("whyChooseUsTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">
                    {t("expertTeachers")}
                  </h3>
                  <p className="text-gray-600">
                    {t("expertTeachersDescription")}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">
                    {t("customClasses")}
                  </h3>
                  <p className="text-gray-600">
                    {t("customClassesDescription")}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">
                    {t("totalFlexibility")}
                  </h3>
                  <p className="text-gray-600">
                    {t("totalFlexibilityDescription")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section>
        <div className="px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold mb-6">{t("ready")}</h2>
          <p className="text-xl text-gray-600 mb-8">{t("joinCommunity")}</p>
          <Link href={`/${locale}/register`}>
            <Button size="lg">{t("registerNow")}</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
