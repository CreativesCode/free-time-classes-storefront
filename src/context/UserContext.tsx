"use client";

import { GET_USER } from "@/graphql/auth";
import { ApolloError, useQuery } from "@apollo/client";
import { createContext, ReactNode, useContext } from "react";

interface BaseContextType<T> {
  data: T | null;
  loading: boolean;
  error: ApolloError | null;
}

interface User {
  id: string;
  username: string;
  email: string;
}

const createGenericContext = <T,>() => {
  return createContext<BaseContextType<T>>({
    data: null,
    loading: true,
    error: null,
  });
};

const UserContext = createGenericContext<User>();

export function UserProvider({ children }: { children: ReactNode }) {
  const { data, loading, error } = useQuery(GET_USER);

  const value = {
    data: data?.me || null,
    loading,
    error: error || null,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

// Generic hook for using any context
export function useGenericContext<T>(
  context: React.Context<BaseContextType<T>>
) {
  const contextValue = useContext(context);
  if (contextValue === undefined) {
    throw new Error(
      "useGenericContext must be used within its corresponding Provider"
    );
  }
  return contextValue;
}
