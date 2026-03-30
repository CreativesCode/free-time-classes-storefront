import type { Course } from "./course";

/** Curso mínimo para la home (tarjetas populares + derivación de tutores destacados). */
export type HomeCourseCard = Pick<
  Course,
  "id" | "title" | "description" | "level" | "max_students"
> & {
  tutor?: { id: string; username: string } | null;
  enrolled_students_count?: number;
};

export type HomeFeaturedTeacher = {
  id: string;
  name: string;
  specialty: string;
  yearsOfExperience: number;
  coursesCount: number;
  profilePicture: string;
};
