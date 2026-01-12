"use client";

import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/queries/users";
import type { User } from "@/types/user";
import { createContext, useContext, useEffect, useState } from "react";

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    isStudent: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  // Initialize: Check for existing session
  useEffect(() => {
    async function initializeUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const userData = await getCurrentUser();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err as Error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initializeUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const userData = await getCurrentUser();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err as Error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

      if (authError) {
        throw authError;
      }

      if (data?.user) {
        // Get user data from public.users table
        const userData = await getCurrentUser();
        setUser(userData);
      } else {
        throw new Error("Login failed: No user data returned");
      }
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    isStudent: boolean
  ) => {
    try {
      setError(null);
      setIsLoading(true);

      // Sign up with Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!data.user) {
        throw new Error("Registration failed: No user data returned");
      }

      // The trigger handle_new_user() should create the user in public.users
      // But we need to update it with is_student/is_tutor flags
      // Wait a bit for the trigger to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update user record with is_student/is_tutor
      const { error: updateError } = await supabase
        .from("users")
        .update({
          is_student: isStudent,
          is_tutor: !isStudent,
        })
        .eq("id", data.user.id);

      if (updateError) {
        console.error("Error updating user flags:", updateError);
        // Continue anyway, the user is created
      }

      // Get the updated user data
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Sign out from Supabase - this will clear the session and cookies
      // The onAuthStateChange listener will automatically set user to null
      const { error: authError } = await supabase.auth.signOut();

      if (authError) {
        throw authError;
      }

      // Clear user state immediately as a fallback
      // The listener should also handle this, but we do it here for immediate feedback
      setUser(null);
    } catch (error) {
      setError(error as Error);
      // Even if there's an error, clear the user state
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      setError(error as Error);
    }
  };

  return (
    <UserContext.Provider
      value={{ user, login, register, logout, refreshUser, isLoading, error }}
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
