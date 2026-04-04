"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/**
 * When URL has ?book=1, scrolls the booking CTA into view (desktop sidebar or mobile bar).
 */
export default function CourseBookingFocus() {
  const searchParams = useSearchParams();
  const ran = useRef(false);
  const hashRan = useRef(false);

  /** After login with ?next=...#course-booking, client navigation may not scroll to the hash. */
  useEffect(() => {
    if (hashRan.current) return;
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#course-booking") return;
    hashRan.current = true;

    function scrollBooking() {
      document
        .querySelector("[data-course-booking]")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    scrollBooking();
    const t1 = window.setTimeout(scrollBooking, 120);
    const t2 = window.setTimeout(scrollBooking, 400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (ran.current) return;
    if (searchParams.get("book") !== "1") return;
    ran.current = true;

    const mq = window.matchMedia("(min-width: 1024px)");
    function scrollTarget() {
      const booking = document.querySelector("[data-course-booking]");
      if (booking) {
        booking.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
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
