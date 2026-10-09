"use client";

import { useEffect, useRef, useState } from "react";
import { useDockHeight, DOCK } from "@/app/_hooks/useDockHeight";

interface Props {
  onClick: () => void;
  hasAnalysisContext: boolean;
}

export default function ChatToggleButton({ onClick, hasAnalysisContext }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  // Defaults to hidden: the page loads at the top, i.e. in the hero. Starting
  // from `false` and relying on the first measurement to correct it means any
  // dropped frame leaves the button sitting on the hero's CTA, and it flashes
  // in before the first paint settles.
  const [inHero, setInHero] = useState(true);

  // Stacks above the privacy notice and the sticky bill, and publishes its own
  // height so the order-tracking stub can clear it in turn.
  useDockHeight(ref, "--dock-agent", !inHero);

  // The hero's job is "upload a photo" — on a phone that CTA is full-width and
  // the floating button lands right on top of it. The agent is the secondary
  // path, so it stays out of the way until the hero is behind you.
  //
  // Deliberately a scroll threshold rather than an IntersectionObserver ratio:
  // the ratio is (visible area / hero height), so the same page flips at
  // different points on a tall phone and a short one. Distance scrolled is the
  // thing actually being asked about.
  useEffect(() => {
    const check = () => setInHero(window.scrollY < window.innerHeight * 0.55);

    const raf = requestAnimationFrame(check);
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      aria-label="Open the ordering agent"
      aria-hidden={inHero}
      tabIndex={inHero ? -1 : 0}
      /* No entrance animation: this control is present for the whole session,
         and `rise` uses fill-mode `both`, so until the animation actually runs
         the button is held 26px below its docked position — enough to overlap
         the sticky bill. Reveals belong on content, not on persistent chrome. */
      className={`btn-press-sm group fixed right-4 z-40 flex items-center gap-2.5 rounded-full bg-ink py-3 pl-3 pr-4 text-paper transition-[opacity,transform] duration-300 md:right-8 ${
        inHero
          ? "pointer-events-none translate-y-3 opacity-0"
          : "translate-y-0 opacity-100"
      }`}
      style={{
        bottom: `calc(${DOCK.cart} + 1.25rem)`,
        boxShadow: "2px 2px 0 rgba(206,58,23,0.9)",
      }}
    >
      {/* Three ticket lines resolving into a cursor — "an agent working",
          without another chat-bubble glyph. */}
      <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-chilli">
        <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden fill="none">
          <path
            d="M3 4h9M3 7.5h6M3 11h4"
            stroke="#fcfaf6"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {hasAnalysisContext && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink bg-paper" />
        )}
      </span>

      <span className="text-[13px] font-semibold tracking-tight">
        Ask the agent
      </span>
    </button>
  );
}
