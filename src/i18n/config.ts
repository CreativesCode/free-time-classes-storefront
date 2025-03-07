import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  return {
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "Europe/Madrid",
    now: new Date(),
    defaultLocale: "en",
    locales: ["en", "es"],
  };
});
