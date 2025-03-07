"use client";

import { GET_USER } from "@/graphql/auth";
import { ApolloError, useQuery } from "@apollo/client";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface BaseContextType<T> {
  data: T | null;
  loading: boolean;
  error: ApolloError | null;
  setData: (data: T | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ApolloError | null) => void;
}

interface AppContextType {
  user: BaseContextType<User>;
  courses: BaseContextType<Course[]>;
  // Add more contexts as needed
}

export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  isStudent?: boolean;
  isTutor?: boolean;
  isStaff?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  // Add more course properties as needed
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

  // Handle user data update
  const handleUserData = useCallback((data: UserQueryData) => {
    // No hacemos nada aquí, la actualización se maneja en useEffect
  }, []);

  // Handle user error
  const handleUserError = useCallback((error: ApolloError) => {
    // No hacemos nada aquí, la actualización se maneja en useEffect
  }, []);

  // Fetch user data when token exists
  const { data: userQueryData, error: userQueryError } =
    useQuery<UserQueryData>(GET_USER, {
      skip: typeof window === "undefined" || !localStorage.getItem("token"),
      onCompleted: handleUserData,
      onError: handleUserError,
    });

  // Update user state when query data changes
  useEffect(() => {
    if (userQueryData?.me) {
      setUserData(userQueryData.me);
      setUserLoading(false);
    }
  }, [userQueryData]);

  // Handle errors in useEffect
  useEffect(() => {
    if (userQueryError) {
      setUserError(userQueryError);
      setUserLoading(false);
    }
  }, [userQueryError]);

  const value = {
    user: {
      data: userData,
      loading: userLoading,
      error: userError,
      setData: setUserData,
      setLoading: setUserLoading,
      setError: setUserError,
    },
    courses: {
      data: coursesData,
      loading: coursesLoading,
      error: coursesError,
      setData: setCoursesData,
      setLoading: setCoursesLoading,
      setError: setCoursesError,
    },
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
