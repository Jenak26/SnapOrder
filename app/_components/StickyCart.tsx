"use client";

import { useCartStore } from "@/app/_lib/cartStore";
import {
  ShoppingCart,
  X,
  Minus,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function StickyCart() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((s) => s.items);
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const toggleSidebar = useCartStore((s) => s.toggleSidebar);
  const itemCount = useCartStore((s) => s.itemCount);
  const totals = useCartStore((s) => s.totals);

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = mounted ? itemCount() : 0;
  const { grandTotal } = totals();

  if (!mounted || count === 0) return null;

  return (
    <div
      id="sticky-cart"
      className="fixed bottom-3 left-0 right-0 z-40 px-3 sm:bottom-5"
    >
      {/* Expanded cart panel (mobile quick view) */}
      <div
        className={`mx-auto max-w-2xl overflow-hidden transition-all duration-500 ${
          expanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="glass-strong mx-auto max-w-2xl rounded-3xl border-b-0 p-5 shadow-2xl shadow-black/30">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Your Cart</h3>
            <button
              onClick={() => setExpanded(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-surface p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-muted">{item.restaurant}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-border">
                    <button
                      onClick={() => decrementItem(item.id)}
                      className="flex h-7 w-7 items-center justify-center text-muted hover:text-foreground"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-medium text-foreground w-4 text-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => incrementItem(item.id)}
                      className="flex h-7 w-7 items-center justify-center text-muted hover:text-foreground"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-foreground w-14 text-right">
                    ₹{item.price * item.qty}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky bar */}
      <div className="glass-strong mx-auto max-w-2xl rounded-3xl border border-white/10 shadow-2xl shadow-black/30">
        <div className="mx-auto flex h-16 items-center justify-between px-5">
          <button
            onClick={() => setExpanded(!expanded)}
            id="sticky-cart-toggle"
            className="flex items-center gap-3"
          >
            <div className="relative">
              <ShoppingCart size={20} className="text-accent" />
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
                {count}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">
                {count} item{count > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted">₹{grandTotal}</p>
            </div>
          </button>
          <button
            id="sticky-cart-checkout"
            onClick={() => {
              setExpanded(false);
              toggleSidebar();
            }}
            className="flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20"
          >
            Checkout
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
