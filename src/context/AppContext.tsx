"use client";

import {
  getLessonsWithRelations,
  LESSON_STATUS_CHOICES,
  type LessonFilters,
} from "@/lib/supabase/queries/lessons";
import type { LessonWithRelations } from "@/types/lesson";
import type { User } from "@/types/user";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
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

export interface Course {
  id: string;
  title: string;
  description: string;
}

interface AppContextType {
  user: BaseContextType<User>;
  courses: BaseContextType<Course[]>;
  lessons: BaseContextType<LessonWithRelations[]>;
  lessonStatusChoices: LessonStatusChoice[];
  refreshLessons: (
    dateRange: { start: Date; end: Date },
    status?: string
  ) => void;
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
  const [coursesData, setCoursesData] = useState<Course[] | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<Error | null>(null);

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
    (dateRange: { start: Date; end: Date }, status?: string) => {
      setLessonsFilters({
        scheduled_date_time_gte: dateRange.start.toISOString(),
        scheduled_date_time_lte: dateRange.end.toISOString(),
        status: status as any,
      });
    },
    []
  );

  const value = {
    user: {
      data: userData,
      loading: userLoading,
      error: userError,
      setData: setUserData,
      setLoading: setUserLoading,
      setError: setUserError,
      refetch: async () => {
        // Refetch is handled by UserContext
        return { data: userData };
      },
    },
    courses: {
      data: coursesData,
      loading: coursesLoading,
      error: coursesError,
      setData: setCoursesData,
      setLoading: setCoursesLoading,
      setError: setCoursesError,
    },
    lessons: {
      data: lessonsData,
      loading: lessonsLoading,
      error: lessonsError,
      setData: setLessonsData,
      setLoading: setLessonsLoading,
      setError: setLessonsError,
      refetch: async () => {
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
      },
    },
    lessonStatusChoices: LESSON_STATUS_CHOICES,
    refreshLessons,
  };

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
