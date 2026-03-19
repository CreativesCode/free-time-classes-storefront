"use client";

import AvailabilityBrowser from "@/components/student/AvailabilityBrowser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/UserContext";
import { COUNTRIES } from "@/lib/constants/countries";
import { getLessonsWithRelations } from "@/lib/supabase/queries/lessons";
import { updateUser } from "@/lib/supabase/queries/users";
import { uploadAvatar } from "@/lib/supabase/storage";
import { getPublicUrl } from "@/lib/supabase/storage";
import { BookOpen, Calendar, Settings, User } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { LessonWithRelations } from "@/types/lesson";

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeoutMs);
    });

    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export default function StudentProfile() {
  const { user, isLoading, refreshUser } = useAuth();
  const t = useTranslations("studentProfile");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnrolledLoading, setIsEnrolledLoading] = useState(false);
  const [enrolledLessons, setEnrolledLessons] = useState<LessonWithRelations[]>([]);
  const [enrolledError, setEnrolledError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    country: "",
  });

  useEffect(() => {
    if (!user) return;
    setFormData({
      username: user.username || "",
      phone: user.phone || "",
      country: user.country || "",
    });
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function loadEnrolledLessons() {
      if (!user?.id) return;

      try {
        setIsEnrolledLoading(true);
        setEnrolledError(null);

        // Lessons are the "scheduled" units a student reserves.
        // We show all lessons assigned to this student.
        const data = await getLessonsWithRelations({
          student_id: user.id,
        });

        if (cancelled) return;
        setEnrolledLessons(data);
      } catch (err) {
        console.error("Error loading enrolled lessons:", err);
        if (cancelled) return;
        setEnrolledError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        if (cancelled) return;
        setIsEnrolledLoading(false);
      }
    }

    void loadEnrolledLessons();
    return () => {
      cancelled = true;
    };
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

  const modalAvatarPreviewUrl = avatarFile
    ? URL.createObjectURL(avatarFile)
    : user.profile_picture && typeof user.profile_picture === "string"
      ? user.profile_picture.startsWith("http")
        ? user.profile_picture
        : getPublicUrl("avatars", user.profile_picture)
      : null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("invalidImageType"));
      return;
    }

    setAvatarFile(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setIsSaving(true);
      let profilePicture = user.profile_picture || null;

      if (avatarFile) {
        profilePicture = await withTimeout(
          uploadAvatar(user.id, avatarFile),
          30000,
          "Avatar upload timeout"
        );
      }

      await withTimeout(
        updateUser(user.id, {
          username: formData.username || user.username,
          phone: formData.phone || null,
          country: formData.country || null,
          profile_picture: profilePicture,
        }),
        15000,
        "Profile update timeout"
      );

      await withTimeout(refreshUser(), 15000, "Refresh user timeout");
      setAvatarFile(null);
      setIsEditModalOpen(false);
      toast.success(t("profileUpdated"));
    } catch (error) {
      console.error("Error updating student profile:", error);
      toast.error(
        error instanceof Error && error.message.includes("timeout")
          ? t("updateTimeout")
          : t("updateError")
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-screen-2xl">
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
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t("settings")}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
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
          <Card>
            <CardHeader>
              <CardTitle>{t("enrolledCourses")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isEnrolledLoading ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  Cargando...
                </div>
              ) : enrolledError ? (
                <div className="py-8 text-center text-destructive text-sm">
                  {enrolledError}
                </div>
              ) : enrolledLessons.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {t("noCoursesEnrolled")}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrolledLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="border rounded-lg p-4 space-y-2 bg-white"
                    >
                      <div className="font-semibold">
                        {lesson.subject?.name ?? "—"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {lesson.tutor?.user?.username ?? "—"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {lesson.scheduled_date_time
                          ? new Date(lesson.scheduled_date_time).toLocaleString()
                          : "—"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {lesson.duration_minutes} {t("availabilities.minutes")}
                        {" · "}
                        ${lesson.price}
                      </div>
                      <div className="text-xs text-gray-500">
                        Status: {lesson.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
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
                    <Button variant="outline" className="w-full justify-start">
                      {t("configureNotifications")}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("changePassword")}
                  </label>
                  <div className="mt-2">
                    <Button variant="outline" className="w-full justify-start">
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

      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            setAvatarFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("editProfile")}</DialogTitle>
            <DialogDescription>{t("editProfileDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("name")}</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder={t("namePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+34 123 456 789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{t("country")}</Label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{t("selectCountry")}</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_file">{t("uploadNewPhoto")}</Label>
              <Input
                id="avatar_file"
                name="avatar_file"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              {modalAvatarPreviewUrl ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-full border">
                  <Image
                    src={modalAvatarPreviewUrl}
                    alt={t("profilePicturePreviewAlt")}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("saving") : t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
