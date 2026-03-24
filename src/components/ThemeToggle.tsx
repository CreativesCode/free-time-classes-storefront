"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type Variant = "icon" | "menu-row";

export function ThemeToggle({ variant = "icon" }: { variant?: Variant }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("navbar");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");

  if (!mounted) {
    if (variant === "menu-row") {
      return (
        <div className="h-12 animate-pulse rounded-2xl bg-muted/50" aria-hidden />
      );
    }
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full"
        disabled
        aria-hidden
      >
        <Sun className="h-5 w-5 opacity-40" />
      </Button>
    );
  }

  if (variant === "menu-row") {
    return (
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm text-foreground transition-colors hover:bg-primary/10 dark:hover:bg-primary/20"
      >
        <span className="flex items-center gap-3 font-medium">
          {isDark ? (
            <Moon className="h-4 w-4 text-primary" />
          ) : (
            <Sun className="h-4 w-4 text-primary" />
          )}
          {t("theme")}
        </span>
        <span className="text-xs text-muted-foreground">
          {isDark ? t("themeDark") : t("themeLight")}
        </span>
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-10 w-10 shrink-0 rounded-full text-foreground hover:bg-primary/10 dark:hover:bg-primary/20"
      onClick={toggle}
      aria-label={t("themeToggleAria")}
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
