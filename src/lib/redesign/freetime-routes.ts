/**
 * Registry of routes already migrated to the FreeTime redesign.
 *
 * Two lists:
 *  - FREETIME_ROUTE_PREFIXES: matches the entry and any descendant route
 *    (e.g. "/auth" matches "/auth/callback").
 *  - FREETIME_ROUTE_EXACT:    matches only the exact pathname suffix
 *    (e.g. "/tutors" matches "/tutors" but not "/tutors/abc"). Useful
 *    while a list page is migrated but its detail subtree isn't yet.
 *
 * Each entry is a path-suffix (without the locale prefix). Add a route
 * here once its page renders inside <FreetimeShell> with the new theme.
 *
 * See docs/design/REDESIGN.md for the migration roadmap.
 */
export const FREETIME_ROUTE_PREFIXES: ReadonlyArray<string> = [
  // Phase 2 — Public onboarding
  "/",
  "/login",
  "/register",
  "/auth/callback",
  // Phase 3 — Discovery
  "/tutors",
  "/courses",
  // Phase 5 — Student area
  "/dashboard",
  "/bookings",
  "/student-profile",
  "/student/profile",
  "/settings",
  // Phase 6 — Communication
  "/messages",
  "/notifications",
  // Phase 7 — Tutor area
  "/become-tutor",
  "/teacher-profile",
  "/tutor/dashboard",
  "/courses/create",
  // Phase 8 — Static pages
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
];

export const FREETIME_ROUTE_EXACT: ReadonlyArray<string> = [
  // Reserved for list pages whose detail subtree isn't migrated yet.
];

/**
 * Strip the locale segment from a Next.js pathname so we can compare against
 * the suffix-only entries.
 *
 * "/es/tutors/abc" -> "/tutors/abc"
 * "/en"           -> "/"
 * "/"             -> "/"
 */
function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/[a-z]{2}(\/.*)?$/i);
  if (!match) return pathname;
  return match[1] ?? "/";
}

export function isFreetimeRoute(pathname: string): boolean {
  const suffix = stripLocale(pathname);

  if (FREETIME_ROUTE_EXACT.includes(suffix)) return true;

  return FREETIME_ROUTE_PREFIXES.some(
    (prefix) => suffix === prefix || suffix.startsWith(prefix + "/")
  );
}
