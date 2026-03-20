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
import { Star } from "lucide-react";

type CourseLevel = NonNullable<CourseFilters["level"]>;

export default function CoursesPage() {
  const tStudent = useTranslations("studentProfile.availabilities");
  const tCommon = useTranslations("common");
  const tHome = useTranslations("home");

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<CourseWithRelations[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  type CourseSort = NonNullable<CourseFilters["sort"]>;

  const [queryFilters, setQueryFilters] = useState<{
    search: string;
    subject_id: string;
    level: CourseLevel | "";
    minPrice: string;
    maxPrice: string;
    minDuration: string;
    maxDuration: string;
    sort: CourseSort;
  }>({
    search: "",
    subject_id: "",
    level: "",
    minPrice: "",
    maxPrice: "",
    minDuration: "",
    maxDuration: "",
    sort: "created_desc",
  });

  // Debounce search so we don't hammer Supabase while typing.
  const [debouncedQueryFilters, setDebouncedQueryFilters] = useState(
    queryFilters
  );
  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedQueryFilters(queryFilters),
      400
    );
    return () => window.clearTimeout(t);
  }, [queryFilters]);

  // Client-only filter (we already fetch tutor info in the query results)
  const [tutorSearch, setTutorSearch] = useState("");
  const [debouncedTutorSearch, setDebouncedTutorSearch] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedTutorSearch(tutorSearch), 300);
    return () => window.clearTimeout(t);
  }, [tutorSearch]);

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

        if (debouncedQueryFilters.subject_id) {
          courseFilters.subject_id = parseInt(
            debouncedQueryFilters.subject_id,
            10
          );
        }

        if (debouncedQueryFilters.level) {
          courseFilters.level =
            debouncedQueryFilters.level as CourseFilters["level"];
        }

        if (debouncedQueryFilters.search.trim()) {
          courseFilters.search = debouncedQueryFilters.search.trim();
        }

        const minPriceNum =
          debouncedQueryFilters.minPrice.trim() === ""
            ? undefined
            : Number(debouncedQueryFilters.minPrice);
        if (minPriceNum !== undefined && !Number.isNaN(minPriceNum)) {
          courseFilters.min_price_per_session = minPriceNum;
        }

        const maxPriceNum =
          debouncedQueryFilters.maxPrice.trim() === ""
            ? undefined
            : Number(debouncedQueryFilters.maxPrice);
        if (maxPriceNum !== undefined && !Number.isNaN(maxPriceNum)) {
          courseFilters.max_price_per_session = maxPriceNum;
        }

        const minDurationNum =
          debouncedQueryFilters.minDuration.trim() === ""
            ? undefined
            : Number(debouncedQueryFilters.minDuration);
        if (minDurationNum !== undefined && !Number.isNaN(minDurationNum)) {
          courseFilters.min_duration_minutes = minDurationNum;
        }

        const maxDurationNum =
          debouncedQueryFilters.maxDuration.trim() === ""
            ? undefined
            : Number(debouncedQueryFilters.maxDuration);
        if (maxDurationNum !== undefined && !Number.isNaN(maxDurationNum)) {
          courseFilters.max_duration_minutes = maxDurationNum;
        }

        courseFilters.sort = debouncedQueryFilters.sort;

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
  }, [debouncedQueryFilters]);

  const displayedCourses = useMemo(() => {
    const needle = debouncedTutorSearch.trim().toLowerCase();
    if (!needle) return courses;
    return courses.filter((course) =>
      (course.tutor?.username ?? "").toLowerCase().includes(needle)
    );
  }, [courses, debouncedTutorSearch]);

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
                (() => {
                  setQueryFilters({
                    search: "",
                    subject_id: "",
                    level: "",
                    minPrice: "",
                    maxPrice: "",
                    minDuration: "",
                    maxDuration: "",
                    sort: "created_desc",
                  });
                  setTutorSearch("");
                })()
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Input
                  placeholder={tStudent("searchPlaceholder")}
                  value={queryFilters.search}
                  onChange={(e) =>
                    setQueryFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <select
                  value={queryFilters.subject_id}
                  onChange={(e) =>
                    setQueryFilters((prev) => ({
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
                  value={queryFilters.level}
                  onChange={(e) =>
                    setQueryFilters((prev) => ({
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

              <div className="space-y-2">
                <Input
                  placeholder={tStudent("tutorNamePlaceholder")}
                  value={tutorSearch}
                  onChange={(e) => setTutorSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Input
                  type="number"
                  min={0}
                  placeholder={tStudent("priceMinPlaceholder")}
                  value={queryFilters.minPrice}
                  onChange={(e) =>
                    setQueryFilters((prev) => ({
                      ...prev,
                      minPrice: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="number"
                  min={0}
                  placeholder={tStudent("priceMaxPlaceholder")}
                  value={queryFilters.maxPrice}
                  onChange={(e) =>
                    setQueryFilters((prev) => ({
                      ...prev,
                      maxPrice: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="number"
                  min={0}
                  placeholder={tStudent("durationMinPlaceholder")}
                  value={queryFilters.minDuration}
                  onChange={(e) =>
                    setQueryFilters((prev) => ({
                      ...prev,
                      minDuration: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="number"
                  min={0}
                  placeholder={tStudent("durationMaxPlaceholder")}
                  value={queryFilters.maxDuration}
                  onChange={(e) =>
                    setQueryFilters((prev) => ({
                      ...prev,
                      maxDuration: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <select
                value={queryFilters.sort}
                onChange={(e) =>
                  setQueryFilters((prev) => ({
                    ...prev,
                    sort: e.target.value as CourseSort,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="created_desc">{tStudent("sortNewest")}</option>
                <option value="price_asc">{tStudent("sortPriceAsc")}</option>
                <option value="price_desc">{tStudent("sortPriceDesc")}</option>
                <option value="duration_asc">
                  {tStudent("sortDurationAsc")}
                </option>
                <option value="duration_desc">
                  {tStudent("sortDurationDesc")}
                </option>
              </select>
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
        ) : displayedCourses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              {tStudent("noAvailabilities")}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-sm text-gray-600">
              {tStudent("resultsCount", { count: displayedCourses.length })}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayedCourses.map((course) => {
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
                          ${course.price_per_session}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>
                          {(course.duration_minutes ?? 0)} {tStudent("minutes")}
                        </span>
                        <span className="text-gray-500">
                          Max {course.max_students}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-1 text-sm text-gray-700">
                        <Star className="h-4 w-4 text-primary-600" fill="currentColor" />
                        <span>{(course.rating ?? 0).toFixed(1)}</span>
                        <span className="text-gray-500">({course.total_reviews ?? 0})</span>
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

