import { createServerClient, type CookieOptions } from "@supabase/ssr";
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

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/student-profile",
  "/teacher-profile",
  "/settings",
  "/tutor/dashboard",
  "/bookings",
  "/messages",
  "/courses/create",
];

const STUDENT_ONLY_ROUTES = ["/student-profile"];
const TUTOR_ONLY_ROUTES = ["/teacher-profile", "/tutor/dashboard", "/courses/create"];

function readBooleanClaim(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  if (typeof value === "number") return value === 1;
  return false;
}

function getRoleClaims(session: {
  user: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> };
}): { isStudent: boolean; isTutor: boolean } {
  const userMetadata = session.user.user_metadata ?? {};
  const appMetadata = session.user.app_metadata ?? {};

  return {
    isStudent: readBooleanClaim(userMetadata.is_student ?? appMetadata.is_student),
    isTutor: readBooleanClaim(userMetadata.is_tutor ?? appMetadata.is_tutor),
  };
}

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
export default async function middleware(req: NextRequest) {
  // Check if the path should be excluded from middleware processing
  const pathname = req.nextUrl.pathname;
  if (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Handle root path - redirect to default locale
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${routing.defaultLocale}`, req.url));
  }

  // Extract locale from pathname
  const pathnameParts = pathname.split("/");
  const localeCandidate = pathnameParts[1];
  const isValidLocale = routing.locales.some(
    (supportedLocale) => supportedLocale === localeCandidate
  );
  const locale = isValidLocale
    ? (localeCandidate as (typeof routing.locales)[number])
    : routing.defaultLocale;
  const pathnameWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), "") || "/";

  // Create Supabase client for middleware
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Get session using Supabase
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthPage =
    pathnameWithoutLocale === "/login" || pathnameWithoutLocale === "/register";

  // Check if the current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathnameWithoutLocale === route || pathnameWithoutLocale.startsWith(`${route}/`)
  );

  // Redirect to login if accessing protected routes without session
  if (!session && isProtectedRoute) {
    const redirectUrl = new URL(`/${locale}/login`, req.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Enforce role-based access for protected sections
  if (session && isProtectedRoute) {
    const { isStudent, isTutor } = getRoleClaims(session);

    const needsStudentRole = STUDENT_ONLY_ROUTES.some(
      (route) =>
        pathnameWithoutLocale === route ||
        pathnameWithoutLocale.startsWith(`${route}/`)
    );
    const needsTutorRole = TUTOR_ONLY_ROUTES.some(
      (route) =>
        pathnameWithoutLocale === route ||
        pathnameWithoutLocale.startsWith(`${route}/`)
    );

    if ((needsStudentRole && !isStudent) || (needsTutorRole && !isTutor)) {
      const redirectUrl = new URL(`/${locale}/login`, req.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect to dashboard if accessing auth pages with active session
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
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
