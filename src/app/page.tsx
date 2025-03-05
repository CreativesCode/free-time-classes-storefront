"use client";
import { useAppData } from "../context/AppContext";

export default function Home() {
  const { data: user, loading, error } = useAppData("user");

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (error)
    return <p className="text-center text-red-500">Error: {error.message}</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-gray-800">
        Welcome, {user?.username}!
      </h1>
      <p className="text-gray-600">Email: {user?.email}</p>
    </div>
  );
}
