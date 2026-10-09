"use client";

import { useEffect, type RefObject } from "react";

/**
 * Publishes a fixed-position element's height to a CSS custom property on
 * <html>, so the other things docked to the bottom of the screen can stack
 * above it instead of on top of it.
 *
 * SnapOrder puts up to four independent fixed elements at the bottom edge —
 * the privacy notice, the sticky bill, the agent button and the order-tracking
 * stub — each rendered from a different place in the tree. On a 390px phone
 * they all landed in the same 194px and overlapped. Hardcoding offsets in each
 * component (the previous approach: `count > 0 ? "bottom-28" : "bottom-6"`)
 * breaks the moment any of them changes height, so each publishes its real
 * measured height and the ones above read it.
 */
export function useDockHeight(
  ref: RefObject<HTMLElement | null>,
  varName: string,
  active = true
) {
  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;

    if (!active || !el) {
      root.style.removeProperty(varName);
      return;
    }

    const publish = () => root.style.setProperty(varName, `${el.offsetHeight}px`);
    publish();

    const ro = new ResizeObserver(publish);
    ro.observe(el);

    return () => {
      ro.disconnect();
      root.style.removeProperty(varName);
    };
  }, [ref, varName, active]);
}

/** Stack offsets, bottom-up. Each layer clears everything docked beneath it. */
export const DOCK = {
  privacy: "var(--dock-privacy, 0px)",
  cart: "calc(var(--dock-privacy, 0px) + var(--dock-cart, 0px))",
  agent:
    "calc(var(--dock-privacy, 0px) + var(--dock-cart, 0px) + var(--dock-agent, 0px))",
} as const;
