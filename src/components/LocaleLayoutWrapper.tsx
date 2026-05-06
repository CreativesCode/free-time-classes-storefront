"use client";

import { AppProvider } from "@/context/AppContext";
import { UserProvider } from "@/context/UserContext";
import { ReactNode } from "react";
import { FreetimeShell } from "./ds/FreetimeShell";
import { ThemeProvider } from "./theme-provider";

interface LocaleLayoutWrapperProps {
  children: ReactNode;
}

export default function LocaleLayoutWrapper({
  children,
}: LocaleLayoutWrapperProps) {
  return (
    <UserProvider>
      <AppProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FreetimeShell>{children}</FreetimeShell>
        </ThemeProvider>
      </AppProvider>
    </UserProvider>
  );
}
