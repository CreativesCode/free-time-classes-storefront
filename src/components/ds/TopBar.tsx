"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  sticky?: boolean;
  transparent?: boolean;
  className?: string;
}

export function TopBar({
  title,
  onBack,
  right,
  sticky = true,
  transparent = false,
  className,
}: TopBarProps) {
  return (
    <div
      className={cn(
        "z-10 flex items-center justify-between px-[18px] py-3",
        sticky && "sticky top-0",
        transparent
          ? "bg-transparent"
          : "border-b border-ft-line-soft bg-ft-paper",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Atrás"
            className="grid h-[38px] w-[38px] place-items-center rounded-full border border-ft-line bg-ft-paper transition-colors hover:bg-ft-surface-1"
          >
            <ArrowLeft width={16} height={16} className="text-ft-ink" />
          </button>
        )}
        {title && (
          <span className="text-base font-semibold tracking-tight text-ft-ink">
            {title}
          </span>
        )}
      </div>
      {right}
    </div>
  );
}
