/**
 * Asks the server to refresh the cached public catalog after a tutor mutation.
 * Best effort: a failure only delays visibility until the ISR window expires,
 * so it never surfaces as an error to the user.
 */
export async function requestCatalogRevalidation(): Promise<void> {
  try {
    await fetch("/api/catalog/revalidate", { method: "POST" });
  } catch (err) {
    console.error("[catalog] revalidation request failed:", err);
  }
}
