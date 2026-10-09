"use client";

import { useEffect } from "react";

/**
 * Single observer for every `[data-reveal]` element on the page.
 *
 * A wrapper component per animated element would nest a div around half the
 * markup; one document-level observer keeps the JSX clean and costs one
 * listener. Results appear after an upload, so a MutationObserver picks up
 * nodes that mount later.
 */
export default function ScrollReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("revealed");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );

    const observeAll = () => {
      document
        .querySelectorAll("[data-reveal]:not(.revealed)")
        .forEach((el) => io.observe(el));
    };

    observeAll();

    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
