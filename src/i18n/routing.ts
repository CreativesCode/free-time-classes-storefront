import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "es"],

  // Used when no locale matches
  defaultLocale: "en",

  // If this locale is matched, pathnames work without a prefix (e.g. `/about`)
  localePrefix: "always",

  // Pathnames are matched against the following patterns:
  // - `/`: Matches the home page
  // - `/:path*`: Matches all other paths
  pathnames: {
    "/": "/",
    "/about": "/about",
    "/contact": "/contact",
    "/dashboard": "/dashboard",
    "/login": "/login",
    "/register": "/register",
    "/profile": "/profile",
    "/settings": "/settings",
    "/courses": "/courses",
    "/courses/[id]": "/courses/[id]",
    "/courses/[id]/lessons": "/courses/[id]/lessons",
    "/courses/[id]/lessons/[lessonId]": "/courses/[id]/lessons/[lessonId]",
  },
});
