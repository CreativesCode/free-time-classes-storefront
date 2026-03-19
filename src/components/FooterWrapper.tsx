"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();
  const isAuthPage =
    pathname.includes("/login") || pathname.includes("/register");

  if (isAuthPage) {
    return null;
  }

  // Empuja el footer al final del viewport cuando el contenido es corto.
  return (
    <div className="mt-auto">
      <Footer />
    </div>
  );
}
