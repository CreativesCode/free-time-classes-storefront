"use client";

import { useMemo, type ReactNode } from "react";
import {
  NextIntlClientProvider,
  useLocale,
  useMessages,
  useNow,
  useTimeZone,
  type AbstractIntlMessages,
} from "next-intl";

/**
 * Adds a route's translation namespaces to the ones its parent already sent
 * (next-intl 3 providers do not merge messages on their own).
 */
export default function IntlScope({
  messages,
  children,
}: {
  messages: AbstractIntlMessages;
  children: ReactNode;
}) {
  const parent = useMessages();
  const locale = useLocale();
  const timeZone = useTimeZone();
  const now = useNow();
  const merged = useMemo(() => ({ ...parent, ...messages }), [parent, messages]);

  return (
    <NextIntlClientProvider locale={locale} messages={merged} timeZone={timeZone} now={now}>
      {children}
    </NextIntlClientProvider>
  );
}
