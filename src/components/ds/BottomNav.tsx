"use client";

import { Calendar, Compass, Home, MessageCircle, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BottomNavTab = "home" | "explore" | "classes" | "messages" | "profile";

interface BottomNavProps {
  active: BottomNavTab;
  onChange: (tab: BottomNavTab) => void;
  className?: string;
}

const ITEMS: ReadonlyArray<{ id: BottomNavTab; label: string; icon: LucideIcon }> = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "explore", label: "Explorar", icon: Compass },
  { id: "classes", label: "Clases", icon: Calendar },
  { id: "messages", label: "Chat", icon: MessageCircle },
  { id: "profile", label: "Tú", icon: User },
];

export function BottomNav({ active, onChange, className }: BottomNavProps) {
  return (
    <nav
      className={cn(
        "absolute inset-x-0 bottom-0 z-20 flex justify-between border-t border-ft-line-soft px-3 pb-7 pt-2.5",
        "bg-[rgba(252,250,246,0.96)] backdrop-blur-xl",
        "pb-[calc(env(safe-area-inset-bottom)+1.5rem)]",
        className
      )}
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-[3px] border-none bg-transparent px-1 py-1.5 transition-colors",
              isActive ? "text-ft-ink" : "text-ft-ink-3 hover:text-ft-ink-2"
            )}
          >
            <Icon
              width={22}
              height={22}
              strokeWidth={isActive ? 2 : 1.6}
            />
            <span
              className={cn(
                "text-[10px] tracking-tight",
                isActive ? "font-semibold" : "font-medium"
              )}
            >
              {item.label}
            </span>
            {isActive && (
              <span className="absolute -top-2.5 h-0.5 w-[18px] rounded-ft-xs bg-ft-accent" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
