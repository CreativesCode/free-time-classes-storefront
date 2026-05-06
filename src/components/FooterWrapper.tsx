"use client";

import { isFreetimeRoute } from "@/lib/redesign/freetime-routes";
import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();
  const isAuthPage =
    pathname.includes("/login") || pathname.includes("/register");

  if (isAuthPage) {
    return null;
  }

  // FreetimeShell renders its own footer; skip the legacy one.
  if (isFreetimeRoute(pathname)) {
    return null;
  }

  return (
    <div className="mt-auto w-full">
      <Footer />
    </div>
  );
}
