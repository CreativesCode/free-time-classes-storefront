"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/**
 * When URL has ?book=1, scrolls the booking CTA into view (desktop sidebar or mobile bar).
 */
export default function CourseBookingFocus() {
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    if (searchParams.get("book") !== "1") return;
    ran.current = true;

    const mq = window.matchMedia("(min-width: 1024px)");
    function scrollTarget() {
      const desktop = document.querySelector("[data-book-cta-desktop]");
      const mobile = document.querySelector("[data-book-cta-mobile]");
      const el = mq.matches ? desktop ?? mobile : mobile ?? desktop;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    scrollTarget();
    const t = window.setTimeout(scrollTarget, 100);
    return () => window.clearTimeout(t);
  }, [searchParams]);

  return null;
}
