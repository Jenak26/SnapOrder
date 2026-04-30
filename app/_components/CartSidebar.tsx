"use client";

import { useCartStore } from "@/app/_lib/cartStore";
import { useOrderStore } from "@/app/_lib/orderStore";
import { useState } from "react";
import {
  X,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  Tag,
  Loader2,
} from "lucide-react";
import SwiggyAttribution from "./SwiggyAttribution";

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

  const count = itemCount();
  const { subtotal, tax, deliveryFee, grandTotal } = totals();

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
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        id="cart-sidebar"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md transition-transform duration-500 ease-out ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col glass-strong border-l border-glass-border">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <ShoppingBag size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Your Cart</h2>
                <p className="text-xs text-muted">
                  {count} item{count !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:text-foreground hover:border-accent"
            >
              <X size={16} />
            </button>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-border bg-black/20">
                  <ShoppingBag size={32} className="text-white/20" />
                </div>
                <h3 className="text-lg font-semibold text-white">Your cart is empty</h3>
                <p className="mt-2 text-sm text-white/50 leading-relaxed max-w-[250px]">
                  Upload a food photo or ask the AI agent to find something delicious.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    className="group rounded-2xl bg-surface p-4 transition-all animate-fade-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {item.restaurant}
                        </p>
                        <p className="mt-1 text-xs font-medium text-accent">
                          ₹{item.price} each
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:text-danger hover:bg-danger/10"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-xl border border-border">
                        <button
                          onClick={() => decrementItem(item.id)}
                          className="flex h-8 w-8 items-center justify-center text-muted hover:text-foreground transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-foreground">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => incrementItem(item.id)}
                          className="flex h-8 w-8 items-center justify-center text-muted hover:text-foreground transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        ₹{item.price * item.qty}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Clear all */}
                <button
                  onClick={clearCart}
                  className="mt-2 w-full rounded-xl border border-border py-2.5 text-xs font-medium text-muted transition-colors hover:border-danger hover:text-danger"
                >
                  Clear cart
                </button>
              </div>
            )}
          </div>

          {/* Footer totals */}
          {items.length > 0 && (
            <div className="border-t border-border px-6 py-5 space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <span className="flex items-center gap-1.5">
                    <Tag size={12} /> Subtotal
                  </span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>GST (5%)</span>
                  <span>₹{tax}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span className="flex items-center gap-1.5">
                    <Truck size={12} /> Delivery
                  </span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-success font-medium">FREE</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <p className="text-[10px] text-muted">
                    Free delivery on orders ₹500+
                  </p>
                )}
                <div className="border-t border-border pt-2 flex justify-between text-base font-bold text-foreground">
                  <span>Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>

              <SwiggyAttribution variant="footer" />

              <button
                id="cart-checkout-btn"
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    Checkout — ₹{grandTotal}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
