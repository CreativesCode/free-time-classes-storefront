"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  active?: boolean;
}

export function Pill({ children, active, className, ...rest }: PillProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-ft-line px-3.5 py-1.5",
        "text-xs font-medium tracking-tight transition-colors",
        active
          ? "bg-ft-ink text-ft-paper"
          : "bg-transparent text-ft-ink-2 hover:bg-ft-surface-1",
        className
      )}
    >
      {children}
    </button>
  );
}
