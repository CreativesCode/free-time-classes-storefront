"use client";

import AvailabilityCalendar from "@/components/teacher/AvailabilityCalendar";
import RecurringAvailabilityManager from "@/components/teacher/RecurringAvailabilityManager";
import EditProfileModal from "@/components/teacher/EditProfileModal";
import TutorBookingRequests from "@/components/teacher/TutorBookingRequests";
import TutorCoursesManager from "@/components/teacher/TutorCoursesManager";
import TutorSubjectsManager from "@/components/teacher/TutorSubjectsManager";
import TutorReviewsSection from "@/components/teacher/TutorReviewsSection";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/UserContext";
import { useLocale, useTranslations } from "@/i18n/translations";
import { getCoursesByTutor } from "@/lib/supabase/queries/courses";
import {
  getTutorProfile,
  getTutorSubjectDetails,
} from "@/lib/supabase/queries/tutors";
import { getPublicUrl } from "@/lib/supabase/storage";
import type { CourseWithRelations } from "@/types/course";
import type { Subject } from "@/types/subject";
import type { TutorProfile } from "@/types/tutor";
import { getAvatarColor } from "@/lib/utils";
import { BookOpen, Inbox, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TeacherProfile() {
  const { user, isLoading, error } = useAuth();
  const router = useRouter();
  const t = useTranslations("teacherProfile");
  const locale = useLocale();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<CourseWithRelations[]>([]);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [calendarRefresh, setCalendarRefresh] = useState(0);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [user, isLoading, router, locale]);

  useEffect(() => {
    const loadTutorData = async () => {
      if (!user?.id) {
        return;
      }

      try {
        setIsProfileLoading(true);
        setProfileError(null);

        const [profile, tutorSubjects, tutorCourses] = await Promise.all([
          getTutorProfile(user.id),
          getTutorSubjectDetails(user.id),
          getCoursesByTutor(user.id),
        ]);

        setTutorProfile(profile);
        setSubjects(tutorSubjects);
        setCourses(tutorCourses);
      } catch (err) {
        console.error("Error loading tutor profile data:", err);
        setProfileError(t("loadError"));
      } finally {
        setIsProfileLoading(false);
      }
    };

    void loadTutorData();
  }, [user?.id, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              {t("error")}
            </CardTitle>
            <CardDescription className="text-center">
              {error.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push(`/${locale}/login`)}>
              {t("backToLogin")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null; // useEffect will handle redirect
  }

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              {t("error")}
            </CardTitle>
            <CardDescription className="text-center">{profileError}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get profile picture URL - if it's a path, construct the full URL, otherwise use as-is
  const profilePictureUrl =
    user.profile_picture && typeof user.profile_picture === "string"
      ? user.profile_picture.startsWith("http")
        ? user.profile_picture
        : getPublicUrl("avatars", user.profile_picture)
      : undefined;

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid gap-6 w-full">
        {/* Profile Header */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-primary-800">{t("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profilePictureUrl} alt="Foto de perfil" />
                <AvatarFallback
                  className="text-white"
                  style={{ backgroundColor: getAvatarColor(user.username) }}
                >
                  {user.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="text-gray-600">{t("teacher")}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="secondary">
                    {t("experience")}:{" "}
                    {tutorProfile?.years_of_experience ?? 0} {t("years")}
                  </Badge>
                  <Badge variant="secondary">
                    {t("courses")}: {courses.length}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
              >
                {t("editProfile")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("profile")}
            </TabsTrigger>
            <TabsTrigger
              value="availability"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              {t("availability")}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              {t("requests.tab")}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            {/* Personal Information */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-primary-800">
                  {t("personalInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input id="email" value={user.email} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("phone")}</Label>
                    <Input id="phone" value={user.phone || t("notProvided")} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">{t("location")}</Label>
                    <Input
                      id="location"
                      value={user.country || tutorProfile?.timezone || t("notProvided")}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialties">{t("specialties")}</Label>
                    <Input
                      id="specialties"
                      value={
                        subjects.length > 0
                          ? subjects.map((subject) => subject.name).join(", ")
                          : t("notProvided")
                      }
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Teaching Experience */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-primary-800">
                  {t("teachingExperience")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="font-semibold">{t("bio")}</h3>
                    <p className="mt-2">
                      {tutorProfile?.bio?.trim() || t("notProvided")}
                    </p>
                  </div>
                  <div className="border-b pb-4">
                    <h3 className="font-semibold">{t("hourlyRate")}</h3>
                    <p className="mt-2">
                      {tutorProfile?.hourly_rate
                        ? `${tutorProfile.hourly_rate} USD`
                        : t("notProvided")}
                    </p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">{t("rating")}:</span>{" "}
                      {tutorProfile?.rating ?? 0}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">{t("totalReviews")}:</span>{" "}
                      {tutorProfile?.total_reviews ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <TutorReviewsSection />

            <TutorSubjectsManager
              tutorId={user.id}
              initialSubjects={subjects}
              onSubjectsUpdated={setSubjects}
            />

            {/* Current Courses */}
            <TutorCoursesManager
              tutorId={user.id}
              initialCourses={courses}
              onCoursesUpdated={setCourses}
            />
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-4">
            <AvailabilityCalendar refreshKey={calendarRefresh} />
            {user?.id ? (
              <RecurringAvailabilityManager
                tutorId={user.id}
                onChanged={() => setCalendarRefresh((n) => n + 1)}
              />
            ) : null}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <TutorBookingRequests />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
