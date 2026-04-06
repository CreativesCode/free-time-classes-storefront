import type { Metadata } from "next";

import { routing } from "@/i18n/routing";

export function getMetadataBase(): URL | undefined {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!raw) return undefined;
  try {
    const normalized = raw.endsWith("/") ? raw.slice(0, -1) : raw;
    return new URL(normalized);
  } catch {
    return undefined;
  }
}

export function truncateForMeta(text: string, maxLen = 155): string {
  const plain = text.replace(/\s+/g, " ").trim();
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen - 1).trimEnd()}…`;
}

type BuildPageMetadataOptions = {
  locale: string;
  /** Ruta sin prefijo de locale, p. ej. `/courses` o `/courses/abc` */
  path: string;
  title: string;
  description: string;
  /** Si true, no aplica la plantilla global del layout */
  titleAbsolute?: boolean;
  robots?: Metadata["robots"];
  /** URLs absolutas de imagen para Open Graph / Twitter */
  openGraphImages?: string[];
};

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  titleAbsolute,
  robots,
  openGraphImages,
}: BuildPageMetadataOptions): Metadata {
  const pathNormalized = path.startsWith("/") ? path : `/${path}`;
  const base = getMetadataBase();

  const ogImage = openGraphImages?.[0];

  const metadata: Metadata = {
    description,
    robots,
    ...(titleAbsolute
      ? { title: { absolute: title } }
      : { title }),
    openGraph: {
      title,
      description,
      locale: locale === "es" ? "es_ES" : "en_US",
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };

  if (base) {
    const withLocale = (loc: string) =>
      new URL(`/${loc}${pathNormalized}`, base).toString();
    metadata.alternates = {
      canonical: withLocale(locale),
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, withLocale(l)])
      ),
    };
  }

  return metadata;
}
