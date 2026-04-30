"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgentCart } from "@/app/_services/types";

// ── Types ────────────────────────────────────────────────
export interface CartItem {
  /** Unique key: `${name}::${restaurant}` */
  id: string;
  itemId: string;
  restaurantId: string;
  name: string;
  restaurant: string;
  price: number;
  qty: number;
  image?: string;
}

export interface CartTotals {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  grandTotal: number;
}

const TAX_RATE = 0.05; // 5 % GST
const DELIVERY_FEE = 40; // flat ₹40
const FREE_DELIVERY_THRESHOLD = 500;

// ── Helpers ──────────────────────────────────────────────
function makeId(name: string, restaurant: string) {
  return `${name}::${restaurant}`;
}

function getLegacyItemId(name: string, restaurant: string) {
  return `${restaurant}-${name}`.replace(/\s+/g, "-").toLowerCase();
}

/** Parse "₹299" / "₹1,299" → 299 / 1299 */
export function parsePrice(raw: string): number {
  return Number(raw.replace(/[^\d.]/g, "")) || 0;
}

// ── Store ────────────────────────────────────────────────
interface CartState {
  items: CartItem[];
  sidebarOpen: boolean;

  // Actions
  addItem: (
    item: Omit<CartItem, "id" | "qty" | "itemId" | "restaurantId"> &
      Partial<Pick<CartItem, "itemId" | "restaurantId">> & { qty?: number }
  ) => void;
  removeItem: (id: string) => void;
  incrementItem: (id: string) => void;
  decrementItem: (id: string) => void;
  clearCart: () => void;
  syncFromAgent: (cart: AgentCart) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Derived (computed on read)
  itemCount: () => number;
  totals: () => CartTotals;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      sidebarOpen: false,

      addItem: (incoming) => {
        const id = makeId(incoming.name, incoming.restaurant);
        set((s) => {
          const exists = s.items.find((i) => i.id === id);
          if (exists) {
            return {
              items: s.items.map((i) =>
                i.id === id
                  ? { ...i, qty: i.qty + (incoming.qty ?? 1) }
                  : i
              ),
            };
          }
          return {
            items: [
              ...s.items,
              {
                ...incoming,
                id,
                itemId: incoming.itemId || getLegacyItemId(incoming.name, incoming.restaurant),
                restaurantId: incoming.restaurantId || incoming.restaurant,
                qty: incoming.qty ?? 1,
              },
            ],
          };
        });
      },

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      incrementItem: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, qty: i.qty + 1 } : i
          ),
        })),

      decrementItem: (id) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
            .filter((i) => i.qty > 0),
        })),

      clearCart: () => set({ items: [] }),

      syncFromAgent: (cart) => {
        set({
          items: cart.items.map((i) => ({
            id: makeId(i.name, cart.restaurantName),
            itemId: i.id,
            restaurantId: cart.restaurantId,
            name: i.name,
            restaurant: cart.restaurantName,
            price: i.price,
            qty: i.quantity,
          })),
        });
      },

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),

      totals: () => {
        const subtotal = get().items.reduce(
          (sum, i) => sum + i.price * i.qty,
          0
        );
        const tax = Math.round(subtotal * TAX_RATE);
        const deliveryFee =
          subtotal === 0
            ? 0
            : subtotal >= FREE_DELIVERY_THRESHOLD
              ? 0
              : DELIVERY_FEE;
        return {
          subtotal,
          tax,
          deliveryFee,
          grandTotal: subtotal + tax + deliveryFee,
        };
      },
    }),
    {
      name: "snaporder-cart",
      // Only persist `items` — sidebar state is ephemeral
      partialize: (state) => ({ items: state.items }),
    }
  )
);
