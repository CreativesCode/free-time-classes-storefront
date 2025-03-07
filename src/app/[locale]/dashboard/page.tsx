"use client";
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
import { useAppData } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { data: user, loading, error } = useAppData("user");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  if (loading) {
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
              Error
            </CardTitle>
            <CardDescription className="text-center">
              {error.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push("/login")}>
              Volver al login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl text-center text-primary-500">
            Welcome, {user.username}!
          </CardTitle>
          <CardDescription className="text-center">
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            {user.profilePicture ? (
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.profilePicture} alt="Profile" />
                <AvatarFallback>
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-24 w-24">
                <AvatarFallback>
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <p className="text-gray-600">Email: {user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {user.isStudent && (
              <Badge variant="secondary" className="text-sm">
                Student
              </Badge>
            )}
            {user.isTutor && (
              <Badge variant="default" className="text-sm">
                Tutor
              </Badge>
            )}
            {user.isStaff && (
              <Badge variant="outline" className="text-sm">
                Staff
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
