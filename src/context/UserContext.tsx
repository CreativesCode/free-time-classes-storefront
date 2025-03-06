"use client";

import {
  GET_USER,
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  REGISTER_MUTATION,
} from "@/graphql/auth";
import { useMutation, useQuery } from "@apollo/client";
import { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  isStudent: boolean;
  isTutor: boolean;
  isStaff: boolean;
}

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    isStudent: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // GraphQL mutations
  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [registerMutation] = useMutation(REGISTER_MUTATION);
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);

  // Query for current user
  const { data: userData } = useQuery(GET_USER, {
    skip: typeof window === "undefined" || !localStorage.getItem("token"),
    onCompleted: (data) => {
      if (data?.me) {
        setUser(data.me);
        setIsLoading(false);
      }
    },
    onError: (error) => {
      setError(error);
      setIsLoading(false);
    },
  });

  useEffect(() => {
    if (userData?.me) {
      setUser(userData.me);
      setIsLoading(false);
    }
  }, [userData]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { data } = await loginMutation({
        variables: { email, password },
      });

      if (data?.tokenAuth?.token) {
        localStorage.setItem("token", data.tokenAuth.token);
        setUser(data.tokenAuth.user);
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    isStudent: boolean
  ) => {
    try {
      setError(null);
      const { data } = await registerMutation({
        variables: {
          email,
          password,
          isStudent,
          isTutor: !isStudent,
        },
      });

      if (data?.createUser?.user) {
        // After successful registration, log the user in
        await login(email, password);
      } else {
        throw new Error("Registration failed");
      }
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await logoutMutation({
          variables: { refreshToken },
        });
      }
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setUser(null);
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{ user, login, register, logout, isLoading, error }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a UserProvider");
  }
  return context;
}
