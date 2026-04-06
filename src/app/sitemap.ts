import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getMetadataBase } from "@/lib/seo/page-metadata";
import { createCatalogServerClient } from "@/lib/supabase/server-public";

/** Regenerar el sitemap periódicamente (catálogo cambia con el tiempo). */
export const revalidate = 3600;

const STATIC_PATHS = [
  "/",
  "/about",
  "/contact",
  "/courses",
  "/tutors",
  "/become-tutor",
  "/privacy-policy",
  "/terms-of-service",
] as const;

function localizedUrl(base: URL, locale: string, path: string): string {
  if (path === "/") {
    return new URL(`/${locale}/`, base).toString();
  }
  return new URL(`/${locale}${path}`, base).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getMetadataBase();
  if (!base) {
    return [];
  }

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: localizedUrl(base, locale, path),
        lastModified: now,
        changeFrequency: path === "/" ? "daily" : "weekly",
        priority: path === "/" ? 1 : path === "/courses" || path === "/tutors" ? 0.9 : 0.7,
      });
    }
  }

  let courseIds: string[] = [];
  let tutorIds: string[] = [];

  try {
    const catalog = createCatalogServerClient();
    const { data, error } = await catalog
      .from("courses")
      .select("id, tutor_id")
      .eq("is_active", true);

    if (!error && data?.length) {
      const courseSet = new Set<string>();
      const tutorSet = new Set<string>();
      for (const row of data) {
        const id = row.id as string | null | undefined;
        const tutorId = row.tutor_id as string | null | undefined;
        if (id) courseSet.add(id);
        if (tutorId) tutorSet.add(tutorId);
      }
      courseIds = [...courseSet];
      tutorIds = [...tutorSet];
    }
  } catch {
    // Sin credenciales o sin red en build: el sitemap solo incluye URLs estáticas.
  }

  for (const locale of routing.locales) {
    for (const id of courseIds) {
      entries.push({
        url: localizedUrl(base, locale, `/courses/${id}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
    for (const id of tutorIds) {
      entries.push({
        url: localizedUrl(base, locale, `/tutors/${id}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  }

  return entries;
}
