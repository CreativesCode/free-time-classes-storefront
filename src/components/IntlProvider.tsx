"use client";

import { AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

type Props = {
  messages: AbstractIntlMessages;
  locale: string;
  children: ReactNode;
};

export default function IntlProvider({ messages, locale, children }: Props) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}
