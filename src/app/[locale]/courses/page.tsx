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
import { Input } from "@/components/ui/input";
import { getPublicUrl } from "@/lib/supabase/storage";
import {
  getCoursesWithRelations,
  type CourseFilters,
} from "@/lib/supabase/queries/courses";
import { getSubjects } from "@/lib/supabase/queries/subjects";
import type { CourseWithRelations } from "@/types/course";
import type { Subject } from "@/types/subject";
import { getAvatarColor } from "@/lib/utils";
import { useTranslations } from "@/i18n/translations";
import { useEffect, useMemo, useState } from "react";

type CourseLevel = NonNullable<CourseFilters["level"]>;

export default function CoursesPage() {
  const tStudent = useTranslations("studentProfile.availabilities");
  const tCommon = useTranslations("common");
  const tHome = useTranslations("home");

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<CourseWithRelations[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<{
    search: string;
    subject_id: string;
    level: CourseLevel | "" ;
  }>({
    search: "",
    subject_id: "",
    level: "",
  });

  // Debounce search so we don't hammer Supabase while typing.
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedFilters(filters), 400);
    return () => window.clearTimeout(t);
  }, [filters]);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await getSubjects();
        setSubjects(data);
      } catch (err) {
        console.error("Error loading subjects:", err);
      }
    }

    void loadSubjects();
  }, []);

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        setError(null);

        const courseFilters: CourseFilters = {
          is_active: true,
        };

        if (debouncedFilters.subject_id) {
          courseFilters.subject_id = parseInt(debouncedFilters.subject_id, 10);
        }

        if (debouncedFilters.level) {
          courseFilters.level = debouncedFilters.level as CourseFilters["level"];
        }

        if (debouncedFilters.search.trim()) {
          courseFilters.search = debouncedFilters.search.trim();
        }

        const data = await getCoursesWithRelations(courseFilters);
        setCourses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }

    void loadCourses();
  }, [debouncedFilters]);

  const levelLabel = useMemo(() => {
    return (level: CourseWithRelations["level"] | null | undefined) => {
      if (level === "advanced") return tHome("advanced");
      if (level === "intermediate") return tHome("intermediate");
      return level ?? "";
    };
  }, [tHome]);

  return (
    <div className="min-h-screen py-10 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">{tStudent("title")}</h1>
            <p className="text-sm text-gray-600">{tCommon("search")}</p>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setFilters({
                  search: "",
                  subject_id: "",
                  level: "",
                })
              }
            >
              {tStudent("filters")}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{tStudent("filters")}</CardTitle>
            <CardDescription>
              Filtra por materia y nivel, o busca por título/descripcion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Input
                  placeholder={tStudent("searchPlaceholder")}
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <select
                  value={filters.subject_id}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      subject_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{tStudent("allSubjects")}</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <select
                  value={filters.level}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      level: e.target.value as CourseLevel | "",
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">{tHome("intermediate")}</option>
                  <option value="advanced">{tHome("advanced")}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center text-red-600">
              {error}
            </CardContent>
          </Card>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              {tStudent("noAvailabilities")}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-sm text-gray-600">
              {tStudent("resultsCount", { count: courses.length })}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const tutor = course.tutor;
                const rawProfilePicture = tutor?.profile_picture;

                const profilePicture =
                  rawProfilePicture && typeof rawProfilePicture === "string"
                    ? rawProfilePicture.startsWith("http")
                      ? rawProfilePicture
                      : getPublicUrl("avatars", rawProfilePicture)
                    : null;

                const firstChar = tutor?.username?.[0]?.toUpperCase() ?? "U";

                return (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {profilePicture ? (
                            <AvatarImage src={profilePicture} alt={tutor?.username ?? "Tutor"} />
                          ) : null}
                          <AvatarFallback
                            className="text-white"
                            style={{ backgroundColor: getAvatarColor(tutor?.username ?? "") }}
                          >
                            {firstChar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {tutor?.username ?? "—"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {course.subject?.name ?? ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-3">
                        <Badge variant="outline">
                          {levelLabel(course.level)}
                        </Badge>
                        <div className="text-sm font-semibold">
                          ${course.price}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>
                          {course.duration_hours}h
                        </span>
                        <span className="text-gray-500">
                          Max {course.max_students}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

