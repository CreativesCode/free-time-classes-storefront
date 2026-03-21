"use client";

import AvailabilityCalendar from "@/components/teacher/AvailabilityCalendar";
import RecurringAvailabilityManager from "@/components/teacher/RecurringAvailabilityManager";
import EditProfileModal from "@/components/teacher/EditProfileModal";
import TutorBookingRequests from "@/components/teacher/TutorBookingRequests";
import TutorCoursesManager from "@/components/teacher/TutorCoursesManager";
import TutorSubjectsManager from "@/components/teacher/TutorSubjectsManager";
import TutorReviewsSection from "@/components/teacher/TutorReviewsSection";
import InternalMessagingPanel from "@/components/messages/InternalMessagingPanel";
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
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Inbox,
  MessageSquare,
  Sparkles,
  Star,
  User,
  Users2,
} from "lucide-react";
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

  const displayName = user.username || t("teacher");
  const bioText = tutorProfile?.bio?.trim() || t("notProvided");
  const specialtiesText =
    subjects.length > 0
      ? subjects.map((subject) => subject.name).join(", ")
      : t("notProvided");
  const expertiseBadges =
    subjects.length > 0
      ? subjects.slice(0, 6).map((subject) => subject.name)
      : [t("specialties"), t("teachingExperience")];

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="mb-6 md:mb-8 rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-violet-50/60 to-fuchsia-50/50 p-5 shadow-sm md:p-8">
        <div className="grid gap-6 md:gap-8 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar className="h-24 w-24 rounded-2xl border-4 border-white shadow-lg sm:h-28 sm:w-28">
                <AvatarImage src={profilePictureUrl} alt="Foto de perfil" />
                <AvatarFallback
                  className="text-xl font-semibold text-white"
                  style={{ backgroundColor: getAvatarColor(user.username) }}
                >
                  {displayName?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-violet-200 bg-violet-100 px-3 py-1 text-[10px] uppercase tracking-wider text-violet-700">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Pro Mentor
                  </Badge>
                  <Badge className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] uppercase tracking-wider text-amber-700">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    {(tutorProfile?.rating ?? 0).toFixed(1)}
                  </Badge>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                  {displayName}
                </h1>
                <p className="mt-1 text-sm font-medium text-violet-700">
                  {t("teacher")}
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
                  {bioText}
                </p>
              </div>
            </div>
          </div>
          <div className="xl:col-span-4 xl:flex xl:items-start xl:justify-end">
            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="h-12 w-full rounded-full bg-violet-700 px-6 text-sm font-semibold text-white hover:bg-violet-800 xl:mt-2 xl:w-auto"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {t("editProfile")}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:grid-cols-4">
          <div className="rounded-2xl border border-violet-100 bg-white/80 p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              {t("rating")}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {(tutorProfile?.rating ?? 0).toFixed(1)}
            </p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white/80 p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              {t("totalReviews")}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {tutorProfile?.total_reviews ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white/80 p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              {t("experience")}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {tutorProfile?.years_of_experience ?? 0}
              <span className="ml-1 text-sm font-medium text-slate-500">
                {t("years")}
              </span>
            </p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white/80 p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              {t("courses")}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{courses.length}</p>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-violet-50 p-2 md:grid-cols-4">
          <TabsTrigger
            value="profile"
            className="flex min-h-10 items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-violet-700"
          >
            <User className="h-4 w-4" />
            {t("profile")}
          </TabsTrigger>
          <TabsTrigger
            value="availability"
            className="flex min-h-10 items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-violet-700"
          >
            <BookOpen className="h-4 w-4" />
            {t("availability")}
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="flex min-h-10 items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-violet-700"
          >
            <Inbox className="h-4 w-4" />
            {t("requests.tab")}
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className="flex min-h-10 items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-violet-700"
          >
            <MessageSquare className="h-4 w-4" />
            {t("messaging.tab")}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-12">
            <Card className="xl:col-span-7 rounded-3xl border-violet-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-slate-900">
                  {t("personalInfo")}
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Información base de contacto y especialización.
                </CardDescription>
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
                    <Input id="specialties" value={specialtiesText} readOnly />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-5 rounded-3xl border-violet-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-slate-900">Expertise</CardTitle>
                <CardDescription className="text-slate-500">
                  Áreas donde destacas como tutor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {expertiseBadges.map((badge) => (
                    <Badge
                      key={badge}
                      variant="secondary"
                      className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700"
                    >
                      <GraduationCap className="mr-1 h-3 w-3" />
                      {badge}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border-violet-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-slate-900">
                {t("teachingExperience")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                  <h3 className="font-semibold text-slate-800">{t("bio")}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {bioText}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-violet-100 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {t("hourlyRate")}
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {tutorProfile?.hourly_rate
                        ? `${tutorProfile.hourly_rate} USD`
                        : t("notProvided")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-violet-100 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {t("rating")}
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {tutorProfile?.rating ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-violet-100 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {t("totalReviews")}
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {tutorProfile?.total_reviews ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-violet-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                <Users2 className="h-5 w-5 text-violet-700" />
                Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TutorReviewsSection />
            </CardContent>
          </Card>

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
          <Card className="rounded-3xl border-violet-100 p-1">
            <CardContent className="space-y-4 p-4 md:p-6">
              <AvailabilityCalendar refreshKey={calendarRefresh} />
              {user?.id ? (
                <RecurringAvailabilityManager
                  tutorId={user.id}
                  onChanged={() => setCalendarRefresh((n) => n + 1)}
                />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card className="rounded-3xl border-violet-100 p-1">
            <CardContent className="p-4 md:p-6">
              <TutorBookingRequests />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card className="rounded-3xl border-violet-100 p-1">
            <CardContent className="p-4 md:p-6">
              <InternalMessagingPanel namespace="teacherProfile" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
