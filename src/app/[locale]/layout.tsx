import LocaleLayoutWrapper from "@/components/LocaleLayoutWrapper";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, unstable_setRequestLocale } from "next-intl/server";
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

type Params = { locale: string };

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { locale } = await params;
  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={poppins.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LocaleLayoutWrapper messages={messages} locale={locale}>
            {children}
          </LocaleLayoutWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
