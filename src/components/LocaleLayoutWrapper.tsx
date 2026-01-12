"use client";

import { AppProvider } from "@/context/AppContext";
import { UserProvider } from "@/context/UserContext";
import { AbstractIntlMessages, IntlProvider } from "next-intl";
import { ReactNode } from "react";
import NavbarWrapper from "./NavbarWrapper";

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
          <NavbarWrapper>{children}</NavbarWrapper>
        </IntlProvider>
      </AppProvider>
    </UserProvider>
  );
}
