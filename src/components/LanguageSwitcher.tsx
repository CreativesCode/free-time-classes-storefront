"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("languageSwitcher");

  const handleLocaleChange = async (newLocale: "en" | "es") => {
    try {
      await router.push(pathname, { locale: newLocale });
    } catch (error) {
      console.error("Error changing locale:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {locale === "en" ? (
            <Image
              src="/images/flags/united_states.svg"
              alt={t("english")}
              width={20}
              height={20}
            />
          ) : (
            <Image
              src="/images/flags/spain.svg"
              alt={t("spanish")}
              width={20}
              height={20}
            />
          )}
          <span className="sr-only">{t("switchLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleLocaleChange("en")}
          className={locale === "en" ? "bg-accent" : ""}
        >
          <Image
            src="/images/flags/united_states.svg"
            alt={t("english")}
            width={20}
            height={20}
            className="mr-2"
          />
          {t("english")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLocaleChange("es")}
          className={locale === "es" ? "bg-accent" : ""}
        >
          <Image
            src="/images/flags/spain.svg"
            alt={t("spanish")}
            width={20}
            height={20}
            className="mr-2"
          />
          {t("spanish")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
