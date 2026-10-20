/**
 * /api/dev/* only runs on a local `next dev` that explicitly opts in with
 * ENABLE_DEV_ROUTES=true (never in production or preview builds).
 */
export function devRoutesEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_DEV_ROUTES === "true"
  );
}
