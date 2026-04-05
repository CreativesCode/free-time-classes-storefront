import type { SupabaseClient } from "@supabase/supabase-js";

export type TutorReviewStats = { rating: number; total_reviews: number };

/**
 * Agrega filas `reviews` (tutor_id + rating) a un mapa por tutor.
 * Fuente de verdad para medias cuando `tutor_profiles.rating` está desactualizado.
 */
export function statsMapFromReviewRows(
  rows: { tutor_id: string; rating: number | null }[] | null | undefined
): Map<string, TutorReviewStats> {
  const acc = new Map<string, { sum: number; count: number }>();
  for (const row of rows ?? []) {
    const tid = row.tutor_id;
    if (!tid) continue;
    const r = Number(row.rating);
    if (!Number.isFinite(r)) continue;
    const prev = acc.get(tid) ?? { sum: 0, count: 0 };
    acc.set(tid, { sum: prev.sum + r, count: prev.count + 1 });
  }
  const out = new Map<string, TutorReviewStats>();
  for (const [tid, { sum, count }] of acc) {
    if (count > 0) {
      out.set(tid, { rating: sum / count, total_reviews: count });
    }
  }
  return out;
}

export async function fetchTutorReviewStatsMap(
  supabase: SupabaseClient,
  tutorIds: string[]
): Promise<Map<string, TutorReviewStats> | null> {
  if (tutorIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("reviews")
    .select("tutor_id, rating")
    .in("tutor_id", tutorIds);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[tutor-review-stats]", error.message, error);
    }
    return null;
  }
  return statsMapFromReviewRows(data);
}

/** Si `stats` es null (error de red/RLS), se devuelve `profile` sin tocar. */
export function mergeTutorProfileReviewStats<
  T extends { id: string; rating?: number | null; total_reviews?: number | null },
>(profile: T, stats: Map<string, TutorReviewStats> | null): T {
  if (!stats) return profile;
  const s = stats.get(profile.id);
  if (s) {
    return { ...profile, rating: s.rating, total_reviews: s.total_reviews };
  }
  return { ...profile, rating: 0, total_reviews: 0 };
}
