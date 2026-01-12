"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/UserContext";
import { getPublicUrl } from "@/lib/supabase/storage";
import { BookOpen, Settings, User } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function StudentProfile() {
  const { user, isLoading } = useAuth();
  const t = useTranslations("studentProfile");

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
              <Button className="mt-4">{t("editProfile")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("enrolledCourses")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Placeholder for enrolled courses */}
                <div className="text-center text-gray-500 py-8">
                  {t("noCoursesEnrolled")}
                </div>
              </div>
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
    </div>
  );
}
