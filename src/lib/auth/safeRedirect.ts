/**
 * Accepts only same-site, locale-prefixed relative paths (e.g. `/es/bookings`)
 * so `?next=` / `?redirect=` can never send the user to another origin.
 */
export function getSafeRedirectNext(locale: string, raw: string | null): string | null {
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/")) return null;
  if (decoded.includes("//")) return null;
  if (decoded.includes("\\")) return null;
  if (!decoded.startsWith(`/${locale}/`)) return null;
  return decoded;
}
