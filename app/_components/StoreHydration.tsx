"use client";

import { useEffect } from "react";
import { useCartStore } from "@/app/_lib/cartStore";
import { useOrderStore } from "@/app/_lib/orderStore";

// The persisted stores skip automatic hydration: reading localStorage during
// module init would make the first client render differ from the server's.
// Pull the saved cart and active order in once React has hydrated.
export default function StoreHydration() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useOrderStore.persist.rehydrate();
  }, []);

  return null;
}
