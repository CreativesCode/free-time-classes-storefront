"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useMemo } from "react";

export type SelectMenuOption = { value: string; label: string };

export type SelectMenuProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectMenuOption[];
  disabled?: boolean;
  align?: "start" | "end" | "center";
  sideOffset?: number;
  /** Wrapper (width, etc.) */
  className?: string;
  /** Si es false, el disparador no ocupa todo el ancho (p. ej. ordenar en barra). */
  fullWidth?: boolean;
  id?: string;
  "aria-label"?: string;
  triggerClassName?: string;
  contentClassName?: string;
  radioItemClassName?: string;
};

/**
 * Select estilizado con menú desplegable (Radix), mismo patrón que el orden en /courses.
 * Sustituye al select nativo (lista del sistema, bordes cuadrados).
 */
export function SelectMenu({
  value,
  onValueChange,
  options,
  disabled,
  align = "start",
  sideOffset = 6,
  className,
  fullWidth = true,
  id,
  "aria-label": ariaLabel,
  triggerClassName,
  contentClassName,
  radioItemClassName,
}: SelectMenuProps) {
  const currentLabel = useMemo(() => {
    const hit = options.find((o) => o.value === value);
    if (hit) return hit.label;
    return options[0]?.label ?? "";
  }, [options, value]);

  return (
    <div
      className={cn(
        "inline-flex min-w-0",
        fullWidth ? "w-full" : "w-auto",
        className
      )}
    >
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <Button
            type="button"
            variant="outline"
            id={id}
            aria-haspopup="menu"
            aria-label={ariaLabel}
            disabled={disabled}
            className={cn(
              "h-10 min-w-0 justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm font-normal shadow-sm hover:bg-accent/40",
              fullWidth ? "w-full" : "w-max min-w-[11rem]",
              triggerClassName
            )}
          >
            <span className="truncate">{currentLabel}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "z-50 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-hidden rounded-lg border bg-popover p-0 text-popover-foreground shadow-lg",
            contentClassName
          )}
        >
          <div className="max-h-72 overflow-y-auto overflow-x-hidden">
            <DropdownMenuRadioGroup
              value={value}
              onValueChange={onValueChange}
              className="p-0"
            >
              {options.map((opt) => (
                <DropdownMenuRadioItem
                  key={opt.value === "" ? "__empty" : opt.value}
                  value={opt.value}
                  className={cn(
                    "cursor-pointer rounded-none py-2 pl-8 pr-3 text-sm outline-none",
                    "focus:bg-accent focus:text-accent-foreground data-[state=checked]:bg-primary/12 data-[state=checked]:font-semibold",
                    radioItemClassName
                  )}
                >
                  {opt.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
