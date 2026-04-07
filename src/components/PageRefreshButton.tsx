"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type PageRefreshButtonProps = {
  className?: string;
};

export function PageRefreshButton({ className }: PageRefreshButtonProps) {
  const t = useTranslations("navbar");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-foreground dark:hover:bg-primary/20",
            className,
          )}
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label={t("refreshAria")}
        >
          <RefreshCw
            className={cn("h-[1.15rem] w-[1.15rem]", isRefreshing && "animate-spin")}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {t("refreshTooltip")}
      </TooltipContent>
    </Tooltip>
  );
}
