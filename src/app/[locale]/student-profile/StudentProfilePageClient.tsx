"use client";

import AvailabilityBrowser from "@/components/student/AvailabilityBrowser";
import StudentProfileEdit from "@/components/student/StudentProfileEdit";
import UpcomingLessonsCard from "@/components/student/UpcomingLessonsCard";
import LessonHistoryTable from "@/components/student/LessonHistoryTable";
import FavoriteTutorsList from "@/components/student/FavoriteTutorsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPublicUrl } from "@/lib/supabase/storage";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  MessageSquare,
  Settings,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { StudentProfile } from "@/types/student";
import StudentBookingRequests from "@/components/student/StudentBookingRequests";
import InternalMessagingPanel from "@/components/messages/InternalMessagingPanel";
import { useRouter, useSearchParams } from "next/navigation";

export type StudentProfilePageUser = {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  country: string | null;
  profile_picture: string | null;
  created_at: string;
  updated_at: string;
};

const STUDENT_PROFILE_TABS = [
  "profile",
  "availabilities",
  "courses",
  "requests",
  "settings",
  "messages",
] as const;
type StudentProfileTab = (typeof STUDENT_PROFILE_TABS)[number];

function parseStudentProfileTab(sp: {
  get(name: string): string | null;
}): StudentProfileTab {
  const raw = sp.get("tab");
  if (
    raw &&
    (STUDENT_PROFILE_TABS as readonly string[]).includes(raw)
  ) {
    return raw as StudentProfileTab;
  }
  return "profile";
}

export default function StudentProfilePageClient({
  locale,
  pageUser,
  initialStudentProfile,
}: {
  locale: string;
  pageUser: StudentProfilePageUser;
  initialStudentProfile: StudentProfile | null;
}) {
  const t = useTranslations("studentProfile");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<StudentProfileTab>(() =>
    parseStudentProfileTab(searchParams)
  );

  useEffect(() => {
    setActiveTab(parseStudentProfileTab(searchParams));
  }, [searchParams]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    initialStudentProfile
  );

  useEffect(() => {
    setStudentProfile(initialStudentProfile);
  }, [initialStudentProfile]);

  const profilePictureUrl =
    pageUser.profile_picture && typeof pageUser.profile_picture === "string"
      ? pageUser.profile_picture.startsWith("http")
        ? pageUser.profile_picture
        : getPublicUrl("avatars", pageUser.profile_picture)
      : null;

  const tabItems = [
    { value: "profile" as const, icon: User, label: t("profile") },
    { value: "availabilities" as const, icon: Calendar, label: t("availabilities.tab") },
    { value: "courses" as const, icon: BookOpen, label: t("courses") },
    { value: "requests" as const, icon: ClipboardList, label: t("requests.tab") },
    { value: "settings" as const, icon: Settings, label: t("settings") },
    { value: "messages" as const, icon: MessageSquare, label: t("messaging.tab") },
  ];

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 pb-24 pt-6 sm:px-6 md:pb-10 md:pt-8">
      {/* Profile Header */}
      <div className="mb-6 flex flex-col items-center gap-4 text-center md:mb-8 md:flex-row md:items-center md:gap-6 md:text-left">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-violet-100 md:h-24 md:w-24">
          {profilePictureUrl ? (
            <Image
              src={profilePictureUrl}
              alt="Profile"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 80px, 96px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-violet-600 text-2xl font-bold text-white md:text-3xl">
              {pageUser.username?.[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground md:text-2xl">
            {pageUser.username}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{pageUser.email}</p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as StudentProfileTab)}
        className="space-y-4"
      >
        <TabsList className="no-scrollbar flex w-full overflow-x-auto md:grid md:grid-cols-6">
          {tabItems.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex shrink-0 items-center gap-2 px-3"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="w-full border-border/60">
            <CardHeader>
              <CardTitle>{t("personalInformation")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("name")}
                  </label>
                  <p className="mt-1 text-sm font-medium text-foreground">{pageUser.username}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("email")}
                  </label>
                  <p className="mt-1 text-sm font-medium text-foreground">{pageUser.email}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("phone")}
                  </label>
                  <p className="mt-1 text-sm font-medium text-foreground">{pageUser.phone || t("notProvided")}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("country")}
                  </label>
                  <p className="mt-1 text-sm font-medium text-foreground">{pageUser.country || t("notProvided")}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("registrationDate")}
                  </label>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {pageUser.created_at
                      ? new Date(pageUser.created_at).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("lastUpdate")}
                  </label>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {pageUser.updated_at
                      ? new Date(pageUser.updated_at).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 border-t border-border/60 pt-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("bio")}
                      </label>
                      <p className="mt-1 text-sm text-foreground">
                        {studentProfile?.bio || t("notProvided")}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("learningGoals")}
                      </label>
                      <p className="mt-1 text-sm text-foreground">
                        {studentProfile?.learning_goals || t("notProvided")}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t("languageLevel")}
                        </label>
                        <p className="mt-1 text-sm font-medium text-foreground">
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
                        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t("timezone")}
                        </label>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {studentProfile?.timezone || t("notProvided")}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("preferredCommunication")}
                      </label>
                      <p className="mt-1 text-sm text-foreground">
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
          <Card className="w-full border-border/60">
            <CardHeader>
              <CardTitle>{t("accountSettings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("emailNotifications")}
                  </label>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start sm:w-auto"
                      onClick={() =>
                        router.push(`/${locale}/settings?tab=notifications`)
                      }
                    >
                      {t("configureNotifications")}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("changePassword")}
                  </label>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start sm:w-auto"
                      onClick={() => router.push(`/${locale}/settings?tab=account`)}
                    >
                      {t("updatePassword")}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("deleteAccount")}
                  </label>
                  <div className="mt-2">
                    <Button
                      variant="destructive"
                      className="w-full justify-start sm:w-auto"
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

        {/* Messaging Tab */}
        <TabsContent value="messages" className="space-y-4">
          <InternalMessagingPanel namespace="studentProfile" />
        </TabsContent>
      </Tabs>
      <StudentProfileEdit
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        studentProfile={studentProfile}
        onUpdated={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
