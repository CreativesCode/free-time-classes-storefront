import { Suspense } from "react";
import StudentProfilePageClient from "./StudentProfilePageClient";

function StudentProfileFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function StudentProfilePage() {
  return (
    <Suspense fallback={<StudentProfileFallback />}>
      <StudentProfilePageClient />
    </Suspense>
  );
}
