/** Video call links must be absolute https URLs (no javascript:, http: or relative). */
export function isValidMeetLink(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
