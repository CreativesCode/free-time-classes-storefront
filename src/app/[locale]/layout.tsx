import LocaleLayoutWrapper from "@/components/LocaleLayoutWrapper";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "Free Time Classes",
  description: "Free Time Classes Storefront",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Params = Promise<{ locale: string }>;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  // Get messages for the locale
  const messages = await getMessages();
  const { locale } = await params;

  return (
    <div
      className={poppins.className}
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone="Europe/Madrid"
        now={new Date()}
      >
        <LocaleLayoutWrapper messages={messages} locale={locale}>
          {children}
        </LocaleLayoutWrapper>
      </NextIntlClientProvider>
    </div>
  );
}
