import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";
import type { DashboardRecommendedCourse } from "./DashboardDeferredRecommended";

interface UpcomingLessonRaw {
  id: string;
  scheduled_date_time: string;
  duration_minutes: number;
  status: string;
  meet_link: string | null;
  subject: { name: string }[] | { name: string } | null;
  tutor:
    | {
        id: string;
        user:
          | { username: string; profile_picture: string | null }[]
          | { username: string; profile_picture: string | null }
          | null;
      }[]
    | {
        id: string;
        user:
          | { username: string; profile_picture: string | null }[]
          | { username: string; profile_picture: string | null }
          | null;
      }
    | null;
}

interface UpcomingLesson {
  id: string;
  scheduled_date_time: string;
  duration_minutes: number;
  status: string;
  subjectName: string | null;
  tutorUsername: string;
  tutorPicture: string | null;
  meetLink: string | null;
}

interface DashboardStats {
  totalClasses: number;
  totalHours: number;
  totalTutors: number;
  pendingRequests: number;
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect(`/${locale}/login`);
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("id, username, profile_picture, is_tutor")
    .eq("id", authUser.id)
    .single();

  const [completedRes, pendingRes, upcomingRes, recommendedRes] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, duration_minutes, tutor_id")
      .eq("student_id", authUser.id)
      .eq("status", "completed"),

    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("student_id", authUser.id)
      .eq("status", "pending"),

    supabase
      .from("lessons")
      .select(
        "id, scheduled_date_time, duration_minutes, status, meet_link, subject:subjects(name), tutor:tutor_profiles!lessons_tutor_id_fkey(id, user:users!tutor_profiles_id_fkey(username, profile_picture))"
      )
      .eq("student_id", authUser.id)
      .in("status", ["confirmed", "scheduled"])
      .gte("scheduled_date_time", new Date().toISOString())
      .order("scheduled_date_time", { ascending: true })
      .limit(3),

    supabase
      .from("courses")
      .select(
        "id, title, cover_image, rating, duration_minutes, subject:subjects(name)"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const completed = completedRes.data ?? [];
  const totalHoursValue = completed.reduce(
    (sum, l) => sum + (l.duration_minutes ?? 0),
    0
  );
  const uniqueTutors = new Set(completed.map((l) => l.tutor_id)).size;

  const stats: DashboardStats = {
    totalClasses: completed.length,
    totalHours: Math.round((totalHoursValue / 60) * 10) / 10,
    totalTutors: uniqueTutors,
    pendingRequests: pendingRes.count ?? 0,
  };

  const rawLessons = (upcomingRes.data ?? []) as UpcomingLessonRaw[];
  const rawRecommended = (recommendedRes.data ?? []) as Array<{
    id: string;
    title: string;
    cover_image: string | null;
    rating: number | null;
    duration_minutes: number;
    subject?: { name: string } | { name: string }[] | null;
  }>;

  const recommendedCourses: DashboardRecommendedCourse[] = rawRecommended.map(
    (row) => {
      const subj = row.subject;
      const subjectName = Array.isArray(subj)
        ? subj[0]?.name
        : subj?.name ?? null;
      return {
        id: row.id,
        title: row.title,
        cover_image: row.cover_image ?? null,
        rating: row.rating ?? null,
        duration_minutes: row.duration_minutes,
        subjectName,
      };
    }
  );

  const upcomingLessons: UpcomingLesson[] = rawLessons.map((l) => {
    const subj = Array.isArray(l.subject) ? l.subject[0] : l.subject;
    const tut = Array.isArray(l.tutor) ? l.tutor[0] : l.tutor;
    const tutUser = tut ? (Array.isArray(tut.user) ? tut.user[0] : tut.user) : null;
    return {
      id: l.id,
      scheduled_date_time: l.scheduled_date_time,
      duration_minutes: l.duration_minutes,
      status: l.status,
      subjectName: subj?.name ?? null,
      tutorUsername: tutUser?.username ?? "Tutor",
      tutorPicture: tutUser?.profile_picture ?? null,
      meetLink: l.meet_link ?? null,
    };
  });

  return (
    <DashboardClient
      user={{
        id: authUser.id,
        username: userRow?.username ?? null,
        profile_picture: userRow?.profile_picture ?? null,
        is_tutor: userRow?.is_tutor ?? false,
      }}
      stats={stats}
      upcomingLessons={upcomingLessons}
      recommendedCourses={recommendedCourses}
    />
  );
}
