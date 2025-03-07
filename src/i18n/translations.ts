import {
  useLocale,
  useTranslations as useNextIntlTranslations,
} from "next-intl";

export function useTranslations(namespace?: string) {
  return useNextIntlTranslations(namespace);
}

export { useLocale };
