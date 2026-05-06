"use client";

import { cn } from "@/lib/utils";

interface SectionTitleProps {
  label: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}

export function SectionTitle({ label, action, onAction, className }: SectionTitleProps) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between px-5 pb-2.5 pt-3.5",
        className
      )}
    >
      <h2 className="m-0 text-base font-semibold tracking-tight text-ft-ink">
        {label}
      </h2>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="border-none bg-transparent text-xs font-medium text-ft-ink-3 hover:text-ft-ink-2"
        >
          {action} →
        </button>
      )}
    </div>
  );
}
