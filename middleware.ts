import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./src/i18n/routing";

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
  // First handle authentication
  const token = req.cookies.get("token")?.value;
  const isAuthPage =
    req.nextUrl.pathname.includes("/login") ||
    req.nextUrl.pathname.includes("/register");

  // Redirect to login if accessing protected routes without token
  if (!token && req.nextUrl.pathname.includes("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect to dashboard if accessing auth pages with token
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Handle root path - redirect to default locale
  if (req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL(`/${routing.defaultLocale}`, req.url));
  }

  // Then handle internationalization
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
    // Match internationalized pathnames
    "/(en|es)/:path*",
    // Match dashboard routes
    "/dashboard/:path*",
    // Match auth routes
    "/login",
    "/register",
    // Match root path
    "/",
  ],
};
