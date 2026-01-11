"use client";

import { GET_USER } from "@/graphql/auth";
import { ALL_LESSONS_QUERY, LESSON_STATUS_CHOICES } from "@/graphql/lessons";
import { ApolloError, useQuery } from "@apollo/client";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface LessonStatusChoice {
  value: string;
  displayName: string;
}

interface LessonStatusData {
  lessonStatusChoices: LessonStatusChoice[];
}

interface BaseContextType<T> {
  data: T | null;
  loading: boolean;
  error: ApolloError | null;
  setData: (data: T | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ApolloError | null) => void;
  refetch?: () => Promise<{ data: T | null }>;
}

interface LessonNode {
  id: string;
  subject: {
    name: string;
    language: {
      name: string;
      level: string;
    };
    description: string;
    icon: string;
  };
  scheduledDateTime: string;
  durationMinutes: number;
  priceAmount: number;
  priceCurrency: string;
  status: string;
  createdAt: string;
}

interface LessonsData {
  allLessons: {
    edges: Array<{
      node: LessonNode;
    }>;
  };
}

interface AppContextType {
  user: BaseContextType<User>;
  courses: BaseContextType<Course[]>;
  lessons: BaseContextType<LessonNode[]>;
  lessonStatusChoices: LessonStatusChoice[];
  refreshLessons: (
    dateRange: { start: Date; end: Date },
    status?: string
  ) => void;
}

export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  isStudent?: boolean;
  isTutor?: boolean;
  isStaff?: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  country?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
}

interface UserQueryData {
  me: User;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // User context state
  const [userData, setUserData] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<ApolloError | null>(null);

  // Courses context state
  const [coursesData, setCoursesData] = useState<Course[] | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<ApolloError | null>(null);

  // Lessons context state
  const [lessonsData, setLessonsData] = useState<LessonNode[] | null>(null);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [lessonsError, setLessonsError] = useState<ApolloError | null>(null);
  const [lessonStatusChoices, setLessonStatusChoices] = useState<
    LessonStatusChoice[]
  >([]);
  const [lessonsVariables, setLessonsVariables] = useState<{
    status?: string;
    scheduledDateTimeGte?: string;
    scheduledDateTimeLte?: string;
  }>({});

  const { data: userQueryData, error: userQueryError } =
    useQuery<UserQueryData>(GET_USER, {
      skip: typeof window === "undefined" || !localStorage.getItem("token"),
    });

  const { data: statusData } = useQuery<LessonStatusData>(
    LESSON_STATUS_CHOICES
  );

  const { data: lessonsQueryData, error: lessonsQueryError } =
    useQuery<LessonsData>(ALL_LESSONS_QUERY, {
      variables: lessonsVariables,
      skip:
        !lessonsVariables.scheduledDateTimeGte ||
        !lessonsVariables.scheduledDateTimeLte,
    });

  // Update lesson status choices when query data changes
  useEffect(() => {
    if (statusData?.lessonStatusChoices) {
      setLessonStatusChoices(statusData.lessonStatusChoices);
    }
  }, [statusData]);

  // Update user state when query data changes
  useEffect(() => {
    if (userQueryData?.me) {
      setUserData(userQueryData.me);
      setUserLoading(false);
    }
  }, [userQueryData]);

  // Handle user errors
  useEffect(() => {
    if (userQueryError) {
      setUserError(userQueryError);
      setUserLoading(false);
    }
  }, [userQueryError]);

  // Update lessons state when query data changes
  useEffect(() => {
    if (lessonsQueryData?.allLessons?.edges) {
      setLessonsData(lessonsQueryData.allLessons.edges.map(({ node }) => node));
      setLessonsLoading(false);
    }
  }, [lessonsQueryData]);

  // Handle lessons errors
  useEffect(() => {
    if (lessonsQueryError) {
      setLessonsError(lessonsQueryError);
      setLessonsLoading(false);
    }
  }, [lessonsQueryError]);

  const refreshLessons = useCallback(
    (dateRange: { start: Date; end: Date }, status?: string) => {
      setLessonsLoading(true);
      setLessonsError(null);
      setLessonsVariables({
        status: status || "available",
        scheduledDateTimeGte: dateRange.start.toISOString(),
        scheduledDateTimeLte: dateRange.end.toISOString(),
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
      refetch: () =>
        userQueryData?.me
          ? Promise.resolve({ data: userQueryData.me })
          : Promise.resolve({ data: null }),
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
    },
    lessonStatusChoices,
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
