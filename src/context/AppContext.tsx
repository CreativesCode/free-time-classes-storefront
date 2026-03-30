"use client";

import {
  getCoursesWithRelations,
  type CourseFilters,
} from "@/lib/supabase/queries/courses";
import {
  LESSON_STATUS_CHOICES,
  getLessonsWithRelations,
  type LessonFilters,
} from "@/lib/supabase/queries/lessons";
import type { CourseWithRelations } from "@/types/course";
import type { LessonStatus, LessonWithRelations } from "@/types/lesson";
import type { User } from "@/types/user";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./UserContext";

interface LessonStatusChoice {
  value: string;
  displayName: string;
}

interface BaseContextType<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  setData: (data: T | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  refetch?: () => Promise<{ data: T | null }>;
}

interface AppContextType {
  user: BaseContextType<User>;
  courses: BaseContextType<CourseWithRelations[]>;
  lessons: BaseContextType<LessonWithRelations[]>;
  lessonStatusChoices: LessonStatusChoice[];
  refreshLessons: (
    dateRange: { start: Date; end: Date },
    status?: LessonStatus
  ) => void;
  refreshCourses: (filters?: CourseFilters) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Use UserContext for user data
  const { user: userFromAuth, isLoading: userLoadingFromAuth } = useAuth();

  // User context state (synced with UserContext)
  const [userData, setUserData] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  // Courses context state
  const [coursesData, setCoursesData] = useState<CourseWithRelations[] | null>(
    null
  );
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<Error | null>(null);
  const [coursesFilters, setCoursesFilters] = useState<CourseFilters | null>(
    null
  );

  // Lessons context state
  const [lessonsData, setLessonsData] = useState<LessonWithRelations[] | null>(
    null
  );
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [lessonsError, setLessonsError] = useState<Error | null>(null);
  const [lessonsFilters, setLessonsFilters] = useState<LessonFilters | null>(
    null
  );

  // Sync user data from UserContext
  useEffect(() => {
    setUserData(userFromAuth || null);
    setUserLoading(userLoadingFromAuth);
  }, [userFromAuth, userLoadingFromAuth]);

  // Fetch courses when filters change
  useEffect(() => {
    async function fetchCourses() {
      if (!coursesFilters) {
        setCoursesLoading(false);
        return;
      }

      try {
        setCoursesLoading(true);
        setCoursesError(null);
        const data = await getCoursesWithRelations(coursesFilters);
        setCoursesData(data);
      } catch (error) {
        setCoursesError(error as Error);
        setCoursesData(null);
      } finally {
        setCoursesLoading(false);
      }
    }

    fetchCourses();
  }, [coursesFilters]);

  // Fetch lessons when filters change
  useEffect(() => {
    async function fetchLessons() {
      if (!lessonsFilters) {
        setLessonsLoading(false);
        return;
      }

      try {
        setLessonsLoading(true);
        setLessonsError(null);
        const data = await getLessonsWithRelations(lessonsFilters);
        setLessonsData(data);
      } catch (error) {
        setLessonsError(error as Error);
        setLessonsData(null);
      } finally {
        setLessonsLoading(false);
      }
    }

    fetchLessons();
  }, [lessonsFilters]);

  const refreshLessons = useCallback(
    (dateRange: { start: Date; end: Date }, status?: LessonStatus) => {
      setLessonsFilters({
        scheduled_date_time_gte: dateRange.start.toISOString(),
        scheduled_date_time_lte: dateRange.end.toISOString(),
        status,
        tutor_id: userData?.id, // Filter by current user's tutor_id
      });
    },
    [userData?.id]
  );

  const refreshCourses = useCallback((filters?: CourseFilters) => {
    setCoursesFilters(filters || {});
  }, []);

  const refetchUser = useCallback(async () => {
    // Refetch is handled by UserContext
    return { data: userData };
  }, [userData]);

  const refetchCourses = useCallback(async () => {
    if (!coursesFilters) {
      return { data: null };
    }
    try {
      const data = await getCoursesWithRelations(coursesFilters);
      setCoursesData(data);
      return { data };
    } catch (error) {
      setCoursesError(error as Error);
      return { data: null };
    }
  }, [coursesFilters]);

  const refetchLessons = useCallback(async () => {
    if (!lessonsFilters) {
      return { data: null };
    }
    try {
      const data = await getLessonsWithRelations(lessonsFilters);
      setLessonsData(data);
      return { data };
    } catch (error) {
      setLessonsError(error as Error);
      return { data: null };
    }
  }, [lessonsFilters]);

  const value = useMemo(
    () => ({
      user: {
        data: userData,
        loading: userLoading,
        error: userError,
        setData: setUserData,
        setLoading: setUserLoading,
        setError: setUserError,
        refetch: refetchUser,
      },
      courses: {
        data: coursesData,
        loading: coursesLoading,
        error: coursesError,
        setData: setCoursesData,
        setLoading: setCoursesLoading,
        setError: setCoursesError,
        refetch: refetchCourses,
      },
      lessons: {
        data: lessonsData,
        loading: lessonsLoading,
        error: lessonsError,
        setData: setLessonsData,
        setLoading: setLessonsLoading,
        setError: setLessonsError,
        refetch: refetchLessons,
      },
      lessonStatusChoices: LESSON_STATUS_CHOICES,
      refreshLessons,
      refreshCourses,
    }),
    [
      userData,
      userLoading,
      userError,
      refetchUser,
      coursesData,
      coursesLoading,
      coursesError,
      refetchCourses,
      lessonsData,
      lessonsLoading,
      lessonsError,
      refetchLessons,
      refreshLessons,
      refreshCourses,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

// Helper hook to use specific context data
export function useAppData<K extends keyof AppContextType>(
  key: K
): AppContextType[K] {
  const context = useApp();
  return context[key];
}
