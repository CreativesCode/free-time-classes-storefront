import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { Locale } from "./types";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  // Check if the locale is valid
  const isValidLocale = routing.locales.some(
    (validLocale) => validLocale === locale
  );

  // Use the locale if valid, otherwise use the default
  const finalLocale = isValidLocale
    ? (locale as Locale)
    : routing.defaultLocale;

  return {
    locale: finalLocale,
    messages: (await import(`../../messages/${finalLocale}.json`)).default,
    timeZone: "Europe/Madrid",
    now: new Date(),
    defaultLocale: routing.defaultLocale,
    locales: routing.locales,
  };
});
