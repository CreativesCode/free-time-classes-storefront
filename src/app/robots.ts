import type { MetadataRoute } from "next";

import { getMetadataBase } from "@/lib/seo/page-metadata";

/**
 * Rutas privadas o de bajo valor SEO: prefijo `/:locale/` vía comodín.
 * Las páginas públicas (inicio, cursos, tutores, legal, etc.) siguen permitidas.
 */
const DISALLOW_PREFIXES = [
  "/api/",
  "/*/auth/",
  "/*/login",
  "/*/register",
  "/*/dashboard",
  "/*/settings",
  "/*/bookings",
  "/*/messages",
  "/*/notifications",
  "/*/student-profile",
  "/*/teacher-profile",
  "/*/student/",
  "/*/tutor/",
  "/*/courses/create",
] as const;

export default function robots(): MetadataRoute.Robots {
  const base = getMetadataBase();

  const rules: MetadataRoute.Robots["rules"] = {
    userAgent: "*",
    allow: "/",
    disallow: [...DISALLOW_PREFIXES],
  };

  if (!base) {
    return { rules };
  }

  return {
    rules,
    sitemap: new URL("/sitemap.xml", base).toString(),
    host: base.host ? `${base.protocol}//${base.host}` : undefined,
  };
}
