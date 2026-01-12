"use client";

import AvailabilityCalendar from "@/components/teacher/AvailabilityCalendar";
import EditProfileModal from "@/components/teacher/EditProfileModal";
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
import { getPublicUrl } from "@/lib/supabase/storage";
import { getAvatarColor } from "@/lib/utils";
import { BookOpen, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TeacherProfile() {
  const { user, isLoading, error } = useAuth();
  const router = useRouter();
  const t = useTranslations("teacherProfile");
  const locale = useLocale();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [user, isLoading, router, locale]);

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

  // Get profile picture URL - if it's a path, construct the full URL, otherwise use as-is
  const profilePictureUrl =
    user.profile_picture && typeof user.profile_picture === "string"
      ? user.profile_picture.startsWith("http")
        ? user.profile_picture
        : getPublicUrl("avatars", user.profile_picture)
      : null;

  return (
    <div className="max-w-screen-2xl mx-auto py-8">
      <div className="grid gap-6">
        {/* Profile Header */}
        <Card>
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
                  <Badge variant="secondary">{t("experience")}: 5 años</Badge>
                  <Badge variant="secondary">{t("courses")}: 12</Badge>
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
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            {/* Personal Information */}
            <Card>
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
                    <Input id="phone" value="+34 123 456 789" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">{t("location")}</Label>
                    <Input id="location" value="Madrid, España" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialties">{t("specialties")}</Label>
                    <Input
                      id="specialties"
                      value="Matemáticas, Física"
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Teaching Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary-800">
                  {t("teachingExperience")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="font-semibold">
                      Universidad Complutense de Madrid
                    </h3>
                    <p className="text-sm text-gray-600">2018 - Presente</p>
                    <p className="mt-2">Profesor de Matemáticas Avanzadas</p>
                  </div>
                  <div className="border-b pb-4">
                    <h3 className="font-semibold">
                      Instituto de Educación Secundaria
                    </h3>
                    <p className="text-sm text-gray-600">2015 - 2018</p>
                    <p className="mt-2">Profesor de Matemáticas y Física</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary-800">
                  {t("currentCourses")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="font-semibold">Cálculo Avanzado</h3>
                      <p className="text-sm text-gray-600">
                        30 {t("students")}
                      </p>
                    </div>
                    <Badge className="bg-accent-500 text-white">
                      {t("inProgress")}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="font-semibold">Física Cuántica</h3>
                      <p className="text-sm text-gray-600">
                        25 {t("students")}
                      </p>
                    </div>
                    <Badge className="bg-accent-500 text-white">
                      {t("inProgress")}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-4">
            <AvailabilityCalendar />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
