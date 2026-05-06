"use client";

import { AppProvider } from "@/context/AppContext";
import { UserProvider } from "@/context/UserContext";
import { isFreetimeRoute } from "@/lib/redesign/freetime-routes";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { FreetimeShell } from "./ds/FreetimeShell";
import NavbarWrapper from "./NavbarWrapper";
import { ThemeProvider } from "./theme-provider";

interface LocaleLayoutWrapperProps {
  children: ReactNode;
}

export default function LocaleLayoutWrapper({
  children,
}: LocaleLayoutWrapperProps) {
  const pathname = usePathname();
  const useFreetime = isFreetimeRoute(pathname);

  return (
    <UserProvider>
      <AppProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {useFreetime ? (
            <FreetimeShell>{children}</FreetimeShell>
          ) : (
            <NavbarWrapper>{children}</NavbarWrapper>
          )}
        </ThemeProvider>
      </AppProvider>
    </UserProvider>
  );
}
