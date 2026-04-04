"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectMenu } from "@/components/ui/select-menu";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import { toast } from "sonner";
import { getSubjects } from "@/lib/supabase/queries/subjects";
import type { LessonWithRelations } from "@/types/lesson";
import type { Subject } from "@/types/subject";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPublicUrl } from "@/lib/supabase/storage";
import { getAvatarColor } from "@/lib/utils";
import { Calendar, Clock, DollarSign, Filter, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type AvailabilityBrowserProps = {
  /** When set, API returns only this tutor's open slots (e.g. from a course page). */
  fixedTutorId?: string | null;
  /** Pre-fill subject filter (and API filter when > 0). */
  initialSubjectId?: number | null;
  /** Hide subject/tutor filters; still allow text search within loaded slots. */
  scopeToCourse?: boolean;
  /** Overrides the default list card title (e.g. course detail heading). */
  listTitle?: string;
};

async function fetchAvailableLessons(
  subjectId: string,
  tutorId: string | null | undefined
): Promise<LessonWithRelations[]> {
  const params = new URLSearchParams();
  if (subjectId) {
    params.set("subjectId", subjectId);
  }
  if (tutorId) {
    params.set("tutorId", tutorId);
  }

  const qs = params.toString();
  const response = await fetch(`/api/lessons/available${qs ? `?${qs}` : ""}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const result = (await response.json().catch(() => null)) as
    | { items?: LessonWithRelations[]; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(result?.error || "Failed to load available lessons.");
  }

  return result?.items || [];
}

export default function AvailabilityBrowser(props: AvailabilityBrowserProps) {
  const {
    fixedTutorId = null,
    initialSubjectId = null,
    scopeToCourse = false,
    listTitle,
  } = props;
  const t = useTranslations("studentProfile.availabilities");
  const { user } = useAuth();
  const [availabilities, setAvailabilities] = useState<LessonWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] =
    useState<LessonWithRelations | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bookingFeedback, setBookingFeedback] = useState<string | null>(null);

  const initialSubject =
    initialSubjectId != null && initialSubjectId > 0 ? String(initialSubjectId) : "";

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    subject_id: initialSubject,
    tutor_name: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  const subjectFilterOptions = useMemo(
    () => [
      { value: "", label: t("allSubjects") },
      ...subjects.map((s) => ({ value: String(s.id), label: s.name })),
    ],
    [subjects, t]
  );

  // Load subjects from database (not needed when scoped to one course)
  useEffect(() => {
    if (scopeToCourse) return;
    async function loadSubjects() {
      try {
        const data = await getSubjects();
        setSubjects(data);
      } catch (err) {
        console.error("Error loading subjects:", err);
      }
    }
    loadSubjects();
  }, [scopeToCourse]);

  // Load availabilities
  useEffect(() => {
    async function loadAvailabilities() {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await fetchAvailableLessons(
          debouncedFilters.subject_id,
          fixedTutorId ?? undefined
        );
        setAvailabilities(data);
      } catch (error) {
        console.error("Error loading availabilities:", error);
        setLoadError(t("loadError"));
        toast.error(t("loadError"));
      } finally {
        setLoading(false);
      }
    }

    void loadAvailabilities();
  }, [debouncedFilters.subject_id, fixedTutorId, t]);

  const filteredAvailabilities = useMemo(() => {
    let filtered = [...availabilities];

    if (debouncedFilters.search) {
      const normalizedSearch = debouncedFilters.search.toLowerCase();
      filtered = filtered.filter(
        (lesson) =>
          lesson.subject?.name
            ?.toLowerCase()
            .includes(normalizedSearch) ||
          lesson.tutor?.user?.username
            ?.toLowerCase()
            .includes(normalizedSearch)
      );
    }

    if (debouncedFilters.subject_id) {
      filtered = filtered.filter(
        (lesson) => lesson.subject_id === parseInt(debouncedFilters.subject_id, 10)
      );
    }

    if (debouncedFilters.tutor_name) {
      const normalizedTutorName = debouncedFilters.tutor_name.toLowerCase();
      filtered = filtered.filter((lesson) =>
        lesson.tutor?.user?.username
          ?.toLowerCase()
          .includes(normalizedTutorName)
      );
    }

    return filtered;
  }, [availabilities, debouncedFilters]);

  const hasPendingFilterChanges =
    filters.search !== debouncedFilters.search ||
    filters.subject_id !== debouncedFilters.subject_id ||
    filters.tutor_name !== debouncedFilters.tutor_name;

  const isUpdatingResults = loading || hasPendingFilterChanges;
  const hasActiveFilters =
    debouncedFilters.search.trim().length > 0 ||
    debouncedFilters.subject_id.length > 0 ||
    debouncedFilters.tutor_name.trim().length > 0;

  const handleBookLesson = async () => {
    if (!selectedLesson || !user?.id) return;

    const lessonId = selectedLesson.id;
    try {
      setBookingLoading(true);
      setBookingFeedback(null);
      const response = await fetch(`/api/bookings/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || t("bookingRequestedError"));
      }

      // Optimistic UI: remove the booked slot immediately.
      setAvailabilities((prev) => prev.filter((lesson) => lesson.id !== lessonId));

      // Reload availabilities
      const data = await fetchAvailableLessons(
        debouncedFilters.subject_id,
        fixedTutorId ?? undefined
      );
      setAvailabilities(data);
      setSelectedLesson(null);
      setBookingFeedback(t("bookingRequested"));

      toast.success(t("bookingRequested"));
    } catch (error) {
      console.error("Error booking lesson:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : t("bookingRequestedError");
      toast.error(message);
    } finally {
      setBookingLoading(false);
    }
  };

  const getTutorProfilePictureUrl = (lesson: LessonWithRelations) => {
    const profilePicture = lesson.tutor?.user?.profile_picture;
    if (profilePicture && typeof profilePicture === "string") {
      return profilePicture.startsWith("http")
        ? profilePicture
        : getPublicUrl("avatars", profilePicture);
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <Card className="w-full rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-primary-800">
              {listTitle ?? t("title")}
            </CardTitle>
            {!scopeToCourse && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {t("filters")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {!scopeToCourse && showFilters && (
            <div className="grid gap-4 md:grid-cols-2 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="avail-filter-subject">{t("subject")}</Label>
                <SelectMenu
                  id="avail-filter-subject"
                  value={filters.subject_id}
                  onValueChange={(subject_id) =>
                    setFilters((prev) => ({ ...prev, subject_id }))
                  }
                  options={subjectFilterOptions}
                  aria-label={t("subject")}
                  triggerClassName="h-10 rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-50/90"
                />
              </div>

              <div className="space-y-2">
                <Label>{t("tutor")}</Label>
                <Input
                  placeholder={t("tutorNamePlaceholder")}
                  value={filters.tutor_name}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      tutor_name: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results count */}
      {loadError ? (
        <div className="text-sm text-destructive">{loadError}</div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {isUpdatingResults ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          ) : null}
          <span>
            {isUpdatingResults
              ? t("loadingResults")
              : t("resultsCount", { count: filteredAvailabilities.length })}
          </span>
        </div>
      )}

      {bookingFeedback && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {bookingFeedback}
        </div>
      )}

      {/* Availabilities grid */}
      {isUpdatingResults ? (
        <Card className="w-full rounded-lg">
          <CardContent className="py-12 text-center text-gray-500">
            {t("loadingResults")}
          </CardContent>
        </Card>
      ) : filteredAvailabilities.length === 0 ? (
        <Card className="w-full rounded-lg">
          <CardContent className="py-12 text-center text-gray-500">
            {hasActiveFilters ? t("noFilteredAvailabilities") : t("noAvailabilities")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAvailabilities.map((lesson) => (
            <Card
              key={lesson.id}
              className="w-full cursor-pointer rounded-lg transition-shadow hover:shadow-lg"
              onClick={() => setSelectedLesson(lesson)}
            >
              <CardContent className="p-4 space-y-3">
                {/* Tutor info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={getTutorProfilePictureUrl(lesson) ?? undefined}
                      alt={lesson.tutor?.user?.username ?? "Tutor"}
                    />
                    <AvatarFallback
                      className="text-white"
                      style={{
                        backgroundColor: getAvatarColor(
                          lesson.tutor?.user?.username || "U"
                        ),
                      }}
                    >
                      {lesson.tutor?.user?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {lesson.tutor?.user?.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {lesson.subject?.name}
                    </p>
                  </div>
                </div>

                {/* Lesson details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {lesson.scheduled_date_time &&
                        new Date(lesson.scheduled_date_time).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{lesson.duration_minutes} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold text-primary-600">
                        {lesson.price}
                      </span>
                    </div>
                  </div>
                </div>

                <Button className="w-full rounded" size="sm">
                  {t("viewDetails")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lesson details dialog */}
      <Dialog
        open={!!selectedLesson}
        onOpenChange={() => setSelectedLesson(null)}
      >
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden p-0 sm:max-w-[525px]">
          <DialogHeader className="px-4 pt-6 sm:px-6">
            <DialogTitle>{t("lessonDetails")}</DialogTitle>
          </DialogHeader>
          {selectedLesson && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-1 sm:px-6">
              {/* Tutor info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={getTutorProfilePictureUrl(selectedLesson) ?? undefined}
                    alt={selectedLesson.tutor?.user?.username ?? "Tutor"}
                  />
                  <AvatarFallback
                    className="text-white text-xl"
                    style={{
                      backgroundColor: getAvatarColor(
                        selectedLesson.tutor?.user?.username || "U"
                      ),
                    }}
                  >
                    {selectedLesson.tutor?.user?.username?.[0]?.toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedLesson.tutor?.user?.username}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedLesson.tutor?.user?.email}
                  </p>
                </div>
              </div>

              {/* Lesson details */}
              <div className="space-y-3">
                <div>
                  <Label className="text-primary-800">{t("subject")}</Label>
                  <p className="mt-1">{selectedLesson.subject?.name}</p>
                </div>
                <div>
                  <Label className="text-primary-800">{t("dateTime")}</Label>
                  <p className="mt-1">
                    {selectedLesson.scheduled_date_time &&
                      new Date(
                        selectedLesson.scheduled_date_time
                      ).toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-primary-800">{t("duration")}</Label>
                    <p className="mt-1">
                      {selectedLesson.duration_minutes} {t("minutes")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-primary-800">{t("price")}</Label>
                    <p className="mt-1 text-lg font-semibold text-primary-600">
                      ${selectedLesson.price}
                    </p>
                  </div>
                </div>
              </div>

              </div>
              {/* Book button */}
              <div className="mt-2 flex shrink-0 justify-end gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
                <Button
                  variant="outline"
                  onClick={() => setSelectedLesson(null)}
                >
                  {t("cancel")}
                </Button>
                <Button onClick={handleBookLesson} disabled={bookingLoading}>
                  {bookingLoading ? t("booking") : t("book")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
