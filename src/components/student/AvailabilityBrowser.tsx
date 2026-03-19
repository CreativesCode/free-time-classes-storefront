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
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import {
  getLessonsWithRelations,
  updateLesson,
} from "@/lib/supabase/queries/lessons";
import { getSubjects } from "@/lib/supabase/queries/subjects";
import type { LessonWithRelations } from "@/types/lesson";
import type { Subject } from "@/types/subject";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getPublicUrl } from "@/lib/supabase/storage";
import { getAvatarColor } from "@/lib/utils";
import { Calendar, Clock, DollarSign, Filter, Search, User } from "lucide-react";
import { useEffect, useState } from "react";

export default function AvailabilityBrowser() {
  const t = useTranslations("studentProfile.availabilities");
  const { user } = useAuth();
  const [availabilities, setAvailabilities] = useState<LessonWithRelations[]>([]);
  const [filteredAvailabilities, setFilteredAvailabilities] = useState<
    LessonWithRelations[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] =
    useState<LessonWithRelations | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    subject_id: "",
    tutor_name: "",
  });

  // Load subjects from database
  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await getSubjects();
        setSubjects(data);
      } catch (err) {
        console.error("Error loading subjects:", err);
      }
    }
    loadSubjects();
  }, []);

  // Load availabilities
  useEffect(() => {
    async function loadAvailabilities() {
      try {
        setLoading(true);
        // Load available lessons from DB. We filter by subject in the query
        // to avoid fetching everything and only filtering on the client.
        const subjectIdNum = filters.subject_id
          ? parseInt(filters.subject_id, 10)
          : null;

        const data = await getLessonsWithRelations({
          status: "available",
          scheduled_date_time_gte: new Date().toISOString(),
          ...(subjectIdNum ? { subject_id: subjectIdNum } : {}),
        });
        setAvailabilities(data);
        setFilteredAvailabilities(data);
      } catch (error) {
        console.error("Error loading availabilities:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAvailabilities();
  }, [filters.subject_id]);

  // Apply filters
  useEffect(() => {
    let filtered = [...availabilities];

    if (filters.search) {
      filtered = filtered.filter(
        (lesson) =>
          lesson.subject?.name
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          lesson.tutor?.user?.username
            ?.toLowerCase()
            .includes(filters.search.toLowerCase())
      );
    }

    if (filters.subject_id) {
      filtered = filtered.filter(
        (lesson) => lesson.subject_id === parseInt(filters.subject_id)
      );
    }

    if (filters.tutor_name) {
      filtered = filtered.filter((lesson) =>
        lesson.tutor?.user?.username
          ?.toLowerCase()
          .includes(filters.tutor_name.toLowerCase())
      );
    }

    setFilteredAvailabilities(filtered);
  }, [filters, availabilities]);

  const handleBookLesson = async () => {
    if (!selectedLesson || !user?.id) return;

    try {
      setBookingLoading(true);
      // Update the lesson to mark it as scheduled and assign the student
      await updateLesson(selectedLesson.id, {
        student_id: user.id,
        status: "scheduled",
      });

      // Reload availabilities
      const data = await getLessonsWithRelations({
        status: "available",
        scheduled_date_time_gte: new Date().toISOString(),
      });
      setAvailabilities(data);
      setFilteredAvailabilities(data);
      setSelectedLesson(null);
    } catch (error) {
      console.error("Error booking lesson:", error);
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-primary-800">
              {t("title")}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {t("filters")}
            </Button>
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
          {showFilters && (
            <div className="grid gap-4 md:grid-cols-2 border-t pt-4">
              <div className="space-y-2">
                <Label>{t("subject")}</Label>
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
                  <option value="">{t("allSubjects")}</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
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
      <div className="text-sm text-gray-600">
        {t("resultsCount", { count: filteredAvailabilities.length })}
      </div>

      {/* Availabilities grid */}
      {filteredAvailabilities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {t("noAvailabilities")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAvailabilities.map((lesson) => (
            <Card
              key={lesson.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedLesson(lesson)}
            >
              <CardContent className="p-4 space-y-3">
                {/* Tutor info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={getTutorProfilePictureUrl(lesson)}
                      alt={lesson.tutor?.user?.username || "Tutor"}
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
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{lesson.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold text-primary-600">
                      ${lesson.price}
                    </span>
                  </div>
                </div>

                <Button className="w-full" size="sm">
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
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{t("lessonDetails")}</DialogTitle>
          </DialogHeader>
          {selectedLesson && (
            <div className="space-y-4">
              {/* Tutor info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={getTutorProfilePictureUrl(selectedLesson)}
                    alt={selectedLesson.tutor?.user?.username || "Tutor"}
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

              {/* Book button */}
              <div className="flex justify-end gap-2 pt-4 border-t">
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
