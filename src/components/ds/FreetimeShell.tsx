"use client";

import { useAuth } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { FreetimeBottomNav } from "./FreetimeBottomNav";
import { FreetimeFooter } from "./FreetimeFooter";
import { FreetimeNavbar } from "./FreetimeNavbar";

interface FreetimeShellProps {
  children: ReactNode;
}

/**
 * Chrome wrapper for the whole locale subtree.
 * Activates the warm paper theme + Geist typography and renders the desktop
 * navbar, bottom nav (mobile, only when logged in), and paper footer.
 *
 * Mounted from LocaleLayoutWrapper — never import this directly into a page.
 */
export function FreetimeShell({ children }: FreetimeShellProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isAuthRoute =
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/auth/");
  const showBottomNav = !isAuthRoute && Boolean(user);

  return (
    <div
      data-theme="freetime"
      className="flex min-h-screen flex-col bg-ft-paper font-geist text-ft-ink antialiased"
    >
      {!isAuthRoute && <FreetimeNavbar />}

      <main
        className={cn(
          "flex flex-1 flex-col",
          showBottomNav && "pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0"
        )}
      >
        {children}
      </main>

      {!isAuthRoute && <FreetimeFooter />}
      {showBottomNav && <FreetimeBottomNav />}
    </div>
  );
}
