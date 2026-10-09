"use client";

import { useCartStore } from "@/app/_lib/cartStore";
import { Minus, Plus, ChevronUp, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDockHeight, DOCK } from "@/app/_hooks/useDockHeight";

export default function StickyCart() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((s) => s.items);
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const toggleSidebar = useCartStore((s) => s.toggleSidebar);
  const itemCount = useCartStore((s) => s.itemCount);
  const totals = useCartStore((s) => s.totals);

  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = mounted ? itemCount() : 0;
  const { grandTotal } = totals();
  const visible = mounted && count > 0;

  // Publish height so the agent button clears the bill instead of sitting on it.
  useDockHeight(ref, "--dock-cart", visible);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      id="sticky-cart"
      className="fixed inset-x-0 z-40 px-4 pb-4"
      style={{ bottom: DOCK.privacy }}
    >
      <div className="mx-auto max-w-xl">
        {/* Quick view */}
        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-400 ${
            expanded ? "mb-2 max-h-[340px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="animate-sheet-up max-h-[300px] overflow-y-auto bg-card px-5 py-4 shadow-[0_20px_50px_-20px_rgba(22,18,14,0.55)]">
            <p className="label mb-3">In the bag</p>
            <ul className="mono">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 border-b border-rule-soft py-2.5 last:border-0"
                >
                  <span className="flex-1 truncate text-[12px] text-ink">
                    {item.name}
                  </span>
                  <span className="flex items-center rounded-full border border-rule">
                    <button
                      onClick={() => decrementItem(item.id)}
                      className="flex h-10 w-10 items-center justify-center text-ink-2 hover:text-ink sm:h-7 sm:w-7"
                      aria-label={`One fewer ${item.name}`}
                    >
                      <Minus size={10} strokeWidth={2.5} />
                    </button>
                    <span className="w-6 text-center text-[11px] font-semibold text-ink">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => incrementItem(item.id)}
                      className="flex h-10 w-10 items-center justify-center text-ink-2 hover:text-ink sm:h-7 sm:w-7"
                      aria-label={`One more ${item.name}`}
                    >
                      <Plus size={10} strokeWidth={2.5} />
                    </button>
                  </span>
                  <span className="w-14 shrink-0 text-right text-[12px] font-semibold text-ink">
                    ₹{item.price * item.qty}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* The bar itself reads as the top edge of a bill: ink block, mono
            figures, one primary action. */}
        <div className="flex items-stretch overflow-hidden rounded-full bg-ink shadow-[0_16px_40px_-14px_rgba(22,18,14,0.7)]">
          <button
            onClick={() => setExpanded(!expanded)}
            id="sticky-cart-toggle"
            aria-expanded={expanded}
            className="flex flex-1 items-center gap-3 py-3 pl-5 pr-3 text-left transition-colors hover:bg-paper/8"
          >
            <span className="mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-chilli text-[11px] font-bold text-card">
              {count}
            </span>
            <span className="min-w-0">
              <span className="mono block text-[13px] font-semibold text-paper">
                ₹{grandTotal}
              </span>
              <span className="label block text-[9px] text-paper/50">
                {expanded ? "Hide items" : "View items"}
              </span>
            </span>
            <ChevronUp
              size={15}
              className={`ml-auto shrink-0 text-paper/50 transition-transform duration-300 ${
                expanded ? "" : "rotate-180"
              }`}
            />
          </button>

          <button
            id="sticky-cart-checkout"
            onClick={() => {
              setExpanded(false);
              toggleSidebar();
            }}
            className="group my-1.5 mr-1.5 flex items-center gap-2 rounded-full bg-chilli px-6 text-[14px] font-semibold text-card transition-colors hover:bg-chilli-2"
          >
            Checkout
            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
