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
import { useTranslations } from "@/i18n/translations";
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

export type TeacherProfilePageUser = {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  country: string | null;
  profile_picture: string | null;
};

export default function TeacherProfileClient({
  teacherUser,
  initialTutorProfile,
  initialSubjects,
  initialCourses,
}: {
  teacherUser: TeacherProfilePageUser;
  initialTutorProfile: TutorProfile | null;
  initialSubjects: Subject[];
  initialCourses: CourseWithRelations[];
}) {
  const router = useRouter();
  const t = useTranslations("teacherProfile");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(
    initialTutorProfile
  );
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [courses, setCourses] = useState<CourseWithRelations[]>(initialCourses);
  const [calendarRefresh, setCalendarRefresh] = useState(0);

  useEffect(() => {
    setTutorProfile(initialTutorProfile);
    setSubjects(initialSubjects);
    setCourses(initialCourses);
  }, [initialTutorProfile, initialSubjects, initialCourses]);

  // Get profile picture URL - if it's a path, construct the full URL, otherwise use as-is
  const profilePictureUrl =
    teacherUser.profile_picture && typeof teacherUser.profile_picture === "string"
      ? teacherUser.profile_picture.startsWith("http")
        ? teacherUser.profile_picture
        : getPublicUrl("avatars", teacherUser.profile_picture)
      : undefined;

  const displayName = teacherUser.username || t("teacher");
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
    <div className="w-full max-w-screen-2xl mx-auto px-4 py-6 sm:px-6 md:py-8 lg:py-10">
      <div className="mb-6 md:mb-8 rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-violet-50/60 to-fuchsia-50/50 p-5 shadow-sm md:p-8">
        <div className="grid gap-6 md:gap-8 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar className="h-24 w-24 rounded-2xl border-4 border-white shadow-lg sm:h-28 sm:w-28">
                <AvatarImage src={profilePictureUrl} alt="Foto de perfil" />
                <AvatarFallback
                  className="text-xl font-semibold text-white"
                  style={{ backgroundColor: getAvatarColor(teacherUser.username) }}
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
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:hidden">
                  {displayName}
                </h1>
                <h1 className="hidden text-4xl font-extrabold tracking-tight text-slate-900 md:block lg:text-5xl">
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
              className="h-12 w-full rounded-full bg-violet-700 px-6 text-sm font-semibold text-white hover:bg-violet-800 md:w-auto xl:mt-2"
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
        onClose={() => {
          setIsEditModalOpen(false);
          router.refresh();
        }}
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-violet-50 p-2 md:grid-cols-4">
          <TabsTrigger
            value="profile"
            className="flex min-h-10 items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-violet-700"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t("profile")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="availability"
            className="flex min-h-10 items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-violet-700"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">{t("availability")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="flex min-h-10 items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-violet-700"
          >
            <Inbox className="h-4 w-4" />
            <span className="hidden sm:inline">{t("requests.tab")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className="flex min-h-10 items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-violet-700"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">{t("messaging.tab")}</span>
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
                    <Input id="email" value={teacherUser.email} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("phone")}</Label>
                    <Input id="phone" value={teacherUser.phone || t("notProvided")} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">{t("location")}</Label>
                    <Input
                      id="location"
                      value={teacherUser.country || tutorProfile?.timezone || t("notProvided")}
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
            tutorId={teacherUser.id}
            initialSubjects={subjects}
            onSubjectsUpdated={setSubjects}
          />

          {/* Current Courses */}
          <TutorCoursesManager
            tutorId={teacherUser.id}
            initialCourses={courses}
            onCoursesUpdated={setCourses}
          />
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-4">
          <Card className="rounded-3xl border-violet-100 p-1">
            <CardContent className="space-y-4 p-4 md:p-6">
              <AvailabilityCalendar refreshKey={calendarRefresh} />
              {teacherUser.id ? (
                <RecurringAvailabilityManager
                  tutorId={teacherUser.id}
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
