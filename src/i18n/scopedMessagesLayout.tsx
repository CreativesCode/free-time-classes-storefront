import type { ReactNode } from "react";
import { getMessages } from "next-intl/server";
import IntlScope from "./IntlScope";
import { PAGE_NAMESPACES, pickMessages } from "./clientMessages";

/** Layout for a route that sends its own translation namespaces (F094). */
export function scopedMessagesLayout(route: keyof typeof PAGE_NAMESPACES) {
  return async function ScopedMessagesLayout({
    children,
    params,
  }: {
    children: ReactNode;
    params: Promise<{ locale: string }>;
  }) {
    const { locale } = await params;
    const messages = await getMessages({ locale });
    return (
      <IntlScope messages={pickMessages(messages, PAGE_NAMESPACES[route])}>{children}</IntlScope>
    );
  };
}
