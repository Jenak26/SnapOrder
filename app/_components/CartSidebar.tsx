"use client";

import { useCartStore } from "@/app/_lib/cartStore";
import { useOrderStore } from "@/app/_lib/orderStore";
import { useState } from "react";
import { X, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import SwiggyAttribution from "./SwiggyAttribution";

/**
 * The cart is a printed bill, not a panel of cards.
 *
 * Mono figures in a right-aligned column, dashed perforations between
 * sections, a torn bottom edge. It is the one object in a food app everybody
 * already knows the shape of, so it needs no explaining — and it makes the
 * arithmetic legible in a way stacked pills never did.
 */
export default function CartSidebar() {
  const items = useCartStore((s) => s.items);
  const sidebarOpen = useCartStore((s) => s.sidebarOpen);
  const setSidebarOpen = useCartStore((s) => s.setSidebarOpen);
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const itemCount = useCartStore((s) => s.itemCount);
  const totals = useCartStore((s) => s.totals);

  const setActiveOrder = useOrderStore((s) => s.setActiveOrder);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const appliedCoupon = useCartStore((s) => s.appliedCoupon);

  const count = itemCount();
  const { subtotal, tax, deliveryFee, discount, grandTotal } = totals();

  const handleCheckout = () => {
    if (items.length === 0) return;
    setIsCheckingOut(true);

    // Simulate payment processing delay
    setTimeout(() => {
      const orderId = "ORD_" + Date.now().toString().slice(-6);
      setActiveOrder({
        orderId,
        estimatedDelivery: new Date(Date.now() + 35 * 60000), // 35 mins from now
        restaurantName: items[0].restaurant,
      });
      clearCart();
      setSidebarOpen(false);
      setIsCheckingOut(false);
    }, 1500);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-ink/55 backdrop-blur-[3px] transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        id="cart-sidebar"
        aria-hidden={!sidebarOpen}
        className={`fixed inset-y-0 right-0 z-[60] flex w-full max-w-[420px] flex-col bg-card transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Bill head ─────────────────────────────────────── */}
        <header className="shrink-0 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="label label-chilli">SnapOrder</p>
              <h2 className="serif mt-1.5 text-[26px] leading-none text-ink">
                Your bill
              </h2>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-rule text-ink transition-colors hover:border-ink hover:bg-paper-2 sm:h-9 sm:w-9"
              aria-label="Close cart"
            >
              <X size={16} />
            </button>
          </div>

          <p className="mono mt-4 flex justify-between text-[10px] text-ink-3">
            <span>
              {count} ITEM{count === 1 ? "" : "S"}
            </span>
            <span>
              {items[0]?.restaurant?.toUpperCase() ?? "NO KITCHEN SELECTED"}
            </span>
          </p>
        </header>

        <div className="perf mx-6" />

        {/* ── Line items ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                aria-hidden
                className="text-ink/18"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="27"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeDasharray="4 6"
                />
                <circle cx="32" cy="32" r="15" stroke="currentColor" strokeWidth="1.25" />
              </svg>
              <p className="serif mt-6 text-[22px] text-ink">An empty plate</p>
              <p className="mt-2 max-w-[240px] text-[13px] leading-relaxed text-ink-2">
                Photograph a dish, or ask the agent to find you something worth
                eating.
              </p>
            </div>
          ) : (
            <ul className="py-2">
              {items.map((item, i) => (
                <li
                  key={item.id}
                  className="animate-rise group border-b border-rule-soft py-4 last:border-0"
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[14px] font-medium leading-snug text-ink">
                      {item.name}
                    </p>
                    <p className="mono shrink-0 text-[13px] font-semibold text-ink">
                      ₹{item.price * item.qty}
                    </p>
                  </div>

                  <p className="mono mt-1 text-[10px] text-ink-3">
                    {item.restaurant} · ₹{item.price} each
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-rule">
                      <button
                        onClick={() => decrementItem(item.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-l-full text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink sm:h-8 sm:w-8"
                        aria-label={`One fewer ${item.name}`}
                      >
                        <Minus size={11} strokeWidth={2.5} />
                      </button>
                      <span className="mono w-8 text-center text-[12px] font-semibold text-ink">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => incrementItem(item.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-r-full text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink sm:h-8 sm:w-8"
                        aria-label={`One more ${item.name}`}
                      >
                        <Plus size={11} strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Always visible on touch. Hover-to-reveal keeps the bill
                        quiet on a pointer device, but on a phone there is no
                        hover — the control was simply unreachable. */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="flex h-10 items-center gap-1.5 rounded-full px-2 text-ink-3 transition-all hover:text-danger focus-visible:opacity-100 sm:h-7 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={12} />
                      <span className="label text-[9px]">Remove</span>
                    </button>
                  </div>
                </li>
              ))}

              <li className="pb-2 pt-4">
                <button
                  onClick={clearCart}
                  className="label w-full py-2 text-center transition-colors hover:text-danger"
                >
                  Clear the whole bill
                </button>
              </li>
            </ul>
          )}
        </div>

        {/* ── Totals ────────────────────────────────────────── */}
        {items.length > 0 && (
          <div className="shrink-0">
            <div className="perf mx-6" />

            <dl className="mono space-y-2 px-6 py-4 text-[12px]">
              <Row k="Subtotal" v={`₹${subtotal}`} />
              <Row k="GST (5%)" v={`₹${tax}`} />
              <Row
                k="Delivery"
                v={deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                tone={deliveryFee === 0 ? "good" : undefined}
              />
              {deliveryFee > 0 && (
                <p className="text-[10px] text-ink-3">
                  Free over ₹500 — ₹{500 - subtotal} to go
                </p>
              )}
              {discount > 0 && (
                <Row
                  k={appliedCoupon ? `Coupon ${appliedCoupon}` : "Discount"}
                  v={`−₹${discount}`}
                  tone="good"
                />
              )}

              <div className="perf !mt-3 pt-3">
                <div className="flex items-baseline justify-between">
                  <dt className="label label-ink">Total</dt>
                  <dd className="numeral text-[30px] leading-none text-ink">
                    ₹{grandTotal}
                  </dd>
                </div>
              </div>

              {discount > 0 && (
                <p className="text-[10px] font-medium text-cardamom">
                  You saved ₹{discount} on this order
                </p>
              )}
            </dl>

            <div className="px-6 pb-5">
              <button
                id="cart-checkout-btn"
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="btn-press flex w-full items-center justify-center gap-2.5 rounded-full bg-chilli py-4 text-[15px] font-semibold text-card hover:bg-chilli-2 disabled:bg-ink-3"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending to the kitchen…
                  </>
                ) : (
                  <>Place order — ₹{grandTotal}</>
                )}
              </button>

              <SwiggyAttribution variant="footer" className="mt-3" />
            </div>

            {/* Torn edge — the bill ends where the paper ends. */}
            <div className="zigzag" />
          </div>
        )}
      </aside>
    </>
  );
}

function Row({
  k,
  v,
  tone,
}: {
  k: string;
  v: string;
  tone?: "good";
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-2">{k}</dt>
      <dd className={tone === "good" ? "font-semibold text-cardamom" : "text-ink"}>
        {v}
      </dd>
    </div>
  );
}
