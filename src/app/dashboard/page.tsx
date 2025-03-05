"use client";
import { useAppData } from "@/context/AppContext";
import Image from "next/image";
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
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error.message}</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-primary-500 mb-4">
          Welcome, {user.username}!
        </h1>
        <div className="space-y-2">
          <p className="text-gray-600">Email: {user.email}</p>
          {user.profilePicture && (
            <Image
              src={user.profilePicture}
              alt="Profile"
              className="w-24 h-24 rounded-full mx-auto"
              width={96}
              height={96}
            />
          )}
          <div className="flex gap-4 justify-center mt-4">
            {user.isStudent && (
              <span className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-sm">
                Student
              </span>
            )}
            {user.isTutor && (
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                Tutor
              </span>
            )}
            {user.isStaff && (
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                Staff
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
