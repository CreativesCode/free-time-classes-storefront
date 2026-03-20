"use client";

import AvailabilityBrowser from "@/components/student/AvailabilityBrowser";
import StudentProfileEdit from "@/components/student/StudentProfileEdit";
import UpcomingLessonsCard from "@/components/student/UpcomingLessonsCard";
import LessonHistoryTable from "@/components/student/LessonHistoryTable";
import FavoriteTutorsList from "@/components/student/FavoriteTutorsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/UserContext";
import { getPublicUrl } from "@/lib/supabase/storage";
import { getStudentProfileWithUser } from "@/lib/supabase/queries/students";
import { BookOpen, Calendar, ClipboardList, Settings, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { StudentProfile } from "@/types/student";
import StudentBookingRequests from "@/components/student/StudentBookingRequests";
import { useRouter } from "next/navigation";

export default function StudentProfile() {
  const { user, isLoading } = useAuth();
  const t = useTranslations("studentProfile");
  const locale = useLocale();
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null
  );
  const [studentProfileLoading, setStudentProfileLoading] = useState(false);
  const [studentProfileError, setStudentProfileError] = useState<string | null>(
    null
  );

  const refreshStudentProfile = async () => {
    if (!user?.id) return;

    setStudentProfileLoading(true);
    setStudentProfileError(null);
    try {
      const data = await getStudentProfileWithUser(user.id);
      setStudentProfile(data);
    } catch (e) {
      console.error("Error loading student profile:", e);
      setStudentProfileError(
        e instanceof Error ? e.message : "Failed to load student profile"
      );
    } finally {
      setStudentProfileLoading(false);
    }
  };

  useEffect(() => {
    void refreshStudentProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Middleware or UserContext will handle redirect
  }

  // Get profile picture URL - if it's a path, construct the full URL, otherwise use as-is
  const profilePictureUrl =
    user.profile_picture && typeof user.profile_picture === "string"
      ? user.profile_picture.startsWith("http")
        ? user.profile_picture
        : getPublicUrl("avatars", user.profile_picture)
      : null;

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile Header */}
      <div className="flex items-center space-x-6 mb-8">
        <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100">
          {profilePictureUrl ? (
            <Image
              src={profilePictureUrl}
              alt="Profile"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-200 text-primary-800 text-3xl font-semibold">
              {user.username?.[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.username}</h1>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t("profile")}
          </TabsTrigger>
          <TabsTrigger
            value="availabilities"
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            {t("availabilities.tab")}
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t("courses")}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            {t("requests.tab")}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t("settings")}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("personalInformation")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("name")}
                  </label>
                  <p className="mt-1">{user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("email")}
                  </label>
                  <p className="mt-1">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("phone")}
                  </label>
                  <p className="mt-1">{user.phone || t("notProvided")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("country")}
                  </label>
                  <p className="mt-1">{user.country || t("notProvided")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("registrationDate")}
                  </label>
                  <p className="mt-1">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("lastUpdate")}
                  </label>
                  <p className="mt-1">
                    {user.updated_at
                      ? new Date(user.updated_at).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                {studentProfileLoading ? (
                  <div className="text-sm text-gray-500">{t("loading")}...</div>
                ) : studentProfileError ? (
                  <div className="text-sm text-destructive text-gray-700">
                    {studentProfileError}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("bio")}
                      </label>
                      <p className="mt-1">
                        {studentProfile?.bio || t("notProvided")}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("learningGoals")}
                      </label>
                      <p className="mt-1">
                        {studentProfile?.learning_goals || t("notProvided")}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          {t("languageLevel")}
                        </label>
                        <p className="mt-1">
                          {studentProfile?.language_level
                            ? (() => {
                                switch (studentProfile.language_level) {
                                  case "beginner":
                                    return t("languageLevels.beginner");
                                  case "elementary":
                                    return t("languageLevels.elementary");
                                  case "intermediate":
                                    return t("languageLevels.intermediate");
                                  case "upper_intermediate":
                                    return t(
                                      "languageLevels.upper_intermediate"
                                    );
                                  case "advanced":
                                    return t("languageLevels.advanced");
                                  case "proficient":
                                    return t("languageLevels.proficient");
                                  default:
                                    return t("notProvided");
                                }
                              })()
                            : t("notProvided")}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          {t("timezone")}
                        </label>
                        <p className="mt-1">
                          {studentProfile?.timezone || t("notProvided")}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {t("preferredCommunication")}
                      </label>
                      <p className="mt-1 text-sm text-gray-700">
                        {[
                          studentProfile?.prefers_audio_calls
                            ? t("prefersAudioCalls")
                            : null,
                          studentProfile?.prefers_video_calls
                            ? t("prefersVideoCalls")
                            : null,
                          studentProfile?.prefers_text_chat
                            ? t("prefersTextChat")
                            : null,
                        ]
                          .filter((v): v is string => Boolean(v))
                          .join(", ") || t("notProvided")}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <Button className="mt-4" onClick={() => setIsEditModalOpen(true)}>
                {t("editProfile")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availabilities Tab */}
        <TabsContent value="availabilities" className="space-y-4">
          <AvailabilityBrowser />
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="space-y-6">
            <UpcomingLessonsCard />
            <LessonHistoryTable />
            <FavoriteTutorsList />
          </div>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <StudentBookingRequests />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("accountSettings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("emailNotifications")}
                  </label>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() =>
                        router.push(`/${locale}/settings?tab=notifications`)
                      }
                    >
                      {t("configureNotifications")}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("changePassword")}
                  </label>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => router.push(`/${locale}/settings?tab=account`)}
                    >
                      {t("updatePassword")}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("deleteAccount")}
                  </label>
                  <div className="mt-2">
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={() => router.push(`/${locale}/settings?tab=account`)}
                    >
                      {t("deleteAccount")}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <StudentProfileEdit
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        studentProfile={studentProfile}
        onUpdated={() => {
          void refreshStudentProfile();
        }}
      />
    </div>
  );
}
