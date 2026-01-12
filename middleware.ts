import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./src/i18n/routing";

// List of paths that should not be processed by the middleware
const PUBLIC_PATHS = [
  "/_next",
  "/api",
  "/static",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.json",
];

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: routing.locales,
  // Used when no locale matches
  defaultLocale: routing.defaultLocale,
  // If this locale is matched, pathnames work without a prefix (e.g. `/about`)
  localePrefix: "always",
  // This is the default locale that will be used when no locale is specified
  localeDetection: true,
  // Enable alternate links
  alternateLinks: true,
});

// Create our custom middleware that combines both functionalities
export default function middleware(req: NextRequest) {
  // Check if the path should be excluded from middleware processing
  const pathname = req.nextUrl.pathname;
  if (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Extract locale from pathname
  const pathnameParts = pathname.split("/");
  const locale =
    pathnameParts[1] && routing.locales.includes(pathnameParts[1])
      ? pathnameParts[1]
      : routing.defaultLocale;

  // First handle authentication
  const token = req.cookies.get("token")?.value;
  const isAuthPage =
    pathname.includes("/login") || pathname.includes("/register");

  // Redirect to login if accessing protected routes without token
  if (!token && pathname.includes("/dashboard")) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  // Redirect to dashboard if accessing auth pages with token
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  }

  // Handle root path - redirect to default locale
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${routing.defaultLocale}`, req.url));
  }

  // Then handle internationalization
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // Match all pathnames except for:
    // - API routes
    // - _next (Next.js internals)
    // - _static (inside /public)
    // - _vercel (Vercel internals)
    // - Static files (images, fonts, etc.)
    "/((?!api|_next/static|_next/image|_vercel|.*\\..*|favicon.ico).*)",
  ],
};
