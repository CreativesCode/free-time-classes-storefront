import FooterWrapper from "@/components/FooterWrapper";
import LocaleLayoutWrapper from "@/components/LocaleLayoutWrapper";
import AppToaster from "@/components/AppToaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, unstable_setRequestLocale } from "next-intl/server";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Params = { locale: string };

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Europe/Madrid"
      now={new Date()}
    >
      <TooltipProvider>
        <LocaleLayoutWrapper>
          {children}
          <FooterWrapper />
          <AppToaster />
        </LocaleLayoutWrapper>
      </TooltipProvider>
    </NextIntlClientProvider>
  );
}
