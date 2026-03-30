"use client";

import { AppProvider } from "@/context/AppContext";
import { UserProvider } from "@/context/UserContext";
import { ReactNode } from "react";
import NavbarWrapper from "./NavbarWrapper";
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
          <NavbarWrapper>{children}</NavbarWrapper>
        </ThemeProvider>
      </AppProvider>
    </UserProvider>
  );
}
