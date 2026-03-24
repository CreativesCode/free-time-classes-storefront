"use client";

import { AppProvider } from "@/context/AppContext";
import { UserProvider } from "@/context/UserContext";
import { AbstractIntlMessages, IntlProvider } from "next-intl";
import { ReactNode } from "react";
import NavbarWrapper from "./NavbarWrapper";
import { ThemeProvider } from "./theme-provider";

interface LocaleLayoutWrapperProps {
  children: ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
}

export default function LocaleLayoutWrapper({
  children,
  messages,
  locale,
}: LocaleLayoutWrapperProps) {
  return (
    <UserProvider>
      <AppProvider>
        <IntlProvider
          messages={messages}
          locale={locale}
          timeZone="Europe/Madrid"
          now={new Date()}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NavbarWrapper>{children}</NavbarWrapper>
          </ThemeProvider>
        </IntlProvider>
      </AppProvider>
    </UserProvider>
  );
}
