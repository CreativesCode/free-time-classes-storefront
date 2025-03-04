"use client";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      const decoded: any = jwtDecode(token);
      setUsername(decoded.username);
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-3xl">Welcome, {username}!</h1>
    </div>
  );
}
