import FooterWrapper from "@/components/FooterWrapper";
import LocaleLayoutWrapper from "@/components/LocaleLayoutWrapper";
import AppToaster from "@/components/AppToaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, unstable_setRequestLocale } from "next-intl/server";
import { Plus_Jakarta_Sans, Poppins } from "next/font/google";
import "./globals.css";

/**
 * Tipografía única según guía Lumina:
 * @see docs/design/stitch/gu_a_de_tipograf_a_freetime_lumina.html
 * Pesos: Regular/Medium/SemiBold/Bold/ExtraBold (400–800)
 */
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

/** Legacy — solo si algún componente usa `font-poppins` */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
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
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${plusJakartaSans.variable} ${poppins.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TooltipProvider>
            <LocaleLayoutWrapper messages={messages} locale={locale}>
              {children}
              <FooterWrapper />
              <AppToaster />
            </LocaleLayoutWrapper>
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
