import { getRequestConfig } from "next-intl/server";
import path from "path";

export default getRequestConfig(async ({ locale }) => {
  return {
    messages: (
      await import(path.join(process.cwd(), `messages/${locale}.json`))
    ).default,
    timeZone: "Europe/Madrid",
    now: new Date(),
    defaultLocale: "en",
    locales: ["en", "es"],
  };
});
