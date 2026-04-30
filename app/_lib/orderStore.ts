"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ActiveOrder {
  orderId: string;
  estimatedDelivery?: Date;
  restaurantName: string;
}

interface OrderState {
  activeOrder: ActiveOrder | null;
  setActiveOrder: (order: ActiveOrder | null) => void;
  clearActiveOrder: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      activeOrder: null,
      setActiveOrder: (order) => set({ activeOrder: order }),
      clearActiveOrder: () => set({ activeOrder: null }),
    }),
    {
      name: "snaporder-active-order",
      // Since Dates are lost in JSON serialization, we need to revive them
      partialize: (state) => ({ activeOrder: state.activeOrder }),
      onRehydrateStorage: () => (state) => {
        if (state?.activeOrder?.estimatedDelivery) {
          state.activeOrder.estimatedDelivery = new Date(state.activeOrder.estimatedDelivery);
        }
      },
    }
  )
);
