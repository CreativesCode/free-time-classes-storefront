import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TutorDashboardClient from "./TutorDashboardClient";
import type { Booking } from "@/types/booking";
import type { LessonWithRelations } from "@/types/lesson";

type PendingBookingItem = {
  booking: Booking;
  lesson: LessonWithRelations | null;
};

interface DashboardStats {
  classesThisMonth: number;
  pendingRequests: number;
  avgRating: number | null;
  earningsThisMonth: number;
}

interface TodayLesson {
  id: number;
  scheduled_date_time: string;
  duration_minutes: number;
  price: number;
  status: string;
  meet_link: string | null;
  subject: { name: string } | null;
  student: { id: string; user: { username: string } | null } | null;
}

export default async function TutorDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("is_tutor")
    .eq("id", user.id)
    .single();

  if (!userProfile?.is_tutor) {
    redirect(`/${locale}/dashboard`);
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [pendingRes, lessonsStatsRes, tutorProfileRes, pendingCountRes, todayLessonsRes] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("*")
        .eq("tutor_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("lessons")
        .select("price")
        .eq("tutor_id", user.id)
        .eq("status", "completed")
        .gte("scheduled_date_time", startOfMonth),
      supabase.from("tutor_profiles").select("rating").eq("id", user.id).single(),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("tutor_id", user.id)
        .eq("status", "pending"),
      supabase
        .from("lessons")
        .select(
          "id, scheduled_date_time, duration_minutes, price, status, meet_link, subject:subjects(name), student:student_profiles!lessons_student_id_fkey(id, user:users!student_profiles_id_fkey(username))"
        )
        .eq("tutor_id", user.id)
        .in("status", ["confirmed", "scheduled"])
        .gte("scheduled_date_time", todayStart.toISOString())
        .lte("scheduled_date_time", todayEnd.toISOString())
        .order("scheduled_date_time", { ascending: true }),
    ]);

  const pendingBookings = (pendingRes.data ?? []).filter(
    (booking) => typeof booking.lesson_id === "number"
  ) as Booking[];
  const lessonIds = pendingBookings
    .map((booking) => booking.lesson_id)
    .filter((lessonId): lessonId is number => typeof lessonId === "number");

  let lessonById = new Map<number, LessonWithRelations>();
  if (lessonIds.length > 0) {
    const { data: pendingLessons } = await supabase
      .from("lessons")
      .select(
        "id, tutor_id, student_id, subject_id, price, scheduled_date_time, duration_minutes, status, meet_link, google_event_id, created_at, updated_at, subject:subjects(id, name, description, icon), student:student_profiles!lessons_student_id_fkey(id, user:users!student_profiles_id_fkey(id, username, email))"
      )
      .in("id", lessonIds);

    lessonById = new Map(
      ((pendingLessons ?? []) as LessonWithRelations[]).map((lesson) => [lesson.id, lesson])
    );
  }

  const pendingItems: PendingBookingItem[] = pendingBookings.map((booking) => ({
    booking,
    lesson:
      typeof booking.lesson_id === "number" ? lessonById.get(booking.lesson_id) ?? null : null,
  }));

  const classesThisMonth = lessonsStatsRes.data?.length ?? 0;
  const earningsThisMonth = (lessonsStatsRes.data ?? []).reduce(
    (sum, lesson) => sum + (lesson.price ?? 0),
    0
  );

  const stats: DashboardStats = {
    classesThisMonth,
    pendingRequests: pendingCountRes.count ?? pendingItems.length,
    avgRating: tutorProfileRes.data?.rating ?? null,
    earningsThisMonth,
  };

  const todayLessons = (todayLessonsRes.data ?? []) as TodayLesson[];

  return (
    <TutorDashboardClient
      initialData={{
        user: { id: user.id, email: user.email ?? null },
        pendingItems,
        stats,
        todayLessons,
      }}
    />
  );
}
