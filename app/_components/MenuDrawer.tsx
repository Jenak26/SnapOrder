"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  X,
  Star,
  Clock,
  MapPin,
  Flame,
  Minus,
  Plus,
} from "lucide-react";
import { type Restaurant } from "@/app/_lib/mockRestaurants";
import { useCartStore } from "@/app/_lib/cartStore";
import {
  generateFallbackRestaurant,
  generateMockMenuSections,
} from "@/app/_lib/menu";
import type { MenuItem, MenuSection } from "@/app/_services/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant | null;
}

interface SwitchWarning {
  willClearCart: boolean;
  currentRestaurantName: string;
  currentItemCount: number;
  currentTotal: number;
}

interface DrawerMenuItem extends MenuItem {
  bestseller?: boolean;
}

function getRestaurantId(restaurant: Restaurant) {
  return restaurant.id || restaurant.name;
}

function getFallbackSections(restaurant: Restaurant): MenuSection[] {
  return generateMockMenuSections(restaurant || generateFallbackRestaurant("Menu"));
}

function isBestseller(item: MenuItem, itemIndex: number, sectionName: string) {
  return (
    itemIndex === 0 &&
    ["recommended", "best sellers", "bestseller", "popular"].some((label) =>
      sectionName.toLowerCase().includes(label)
    )
  );
}

export default function MenuDrawer({ isOpen, onClose, restaurant }: Props) {
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [switchWarning, setSwitchWarning] = useState<SwitchWarning | null>(null);
  const [isSwitchCheckDone, setIsSwitchCheckDone] = useState(false);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Cart integration
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const loadMenu = useCallback(async (activeRestaurant: Restaurant) => {
    setIsLoadingMenu(true);
    const restaurantId = getRestaurantId(activeRestaurant);

    try {
      const res = await fetch(
        `/api/menu?restaurantId=${encodeURIComponent(restaurantId)}`
      );
      const data = (await res.json()) as {
        success?: boolean;
        sections?: MenuSection[];
      };

      if (!data.success || !data.sections || data.sections.length === 0) {
        setSections(getFallbackSections(activeRestaurant));
      } else {
        setSections(data.sections);
      }
    } catch {
      setSections(getFallbackSections(activeRestaurant));
    } finally {
      setIsLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !restaurant) {
      const resetTimer = window.setTimeout(() => {
        setSections([]);
        setSwitchWarning(null);
        setIsSwitchCheckDone(false);
        setIsLoadingMenu(false);
      }, 0);

      return () => window.clearTimeout(resetTimer);
    }

    let cancelled = false;
    const activeRestaurant = restaurant;
    const restaurantId = getRestaurantId(restaurant);

    async function checkSwitchAndLoad() {
      setSections([]);
      setSwitchWarning(null);
      setIsSwitchCheckDone(false);
      setIsLoadingMenu(true);

      try {
        const res = await fetch(
          `/api/cart/switch-check?restaurantId=${encodeURIComponent(
            restaurantId
          )}`
        );
        const warning = (await res.json()) as SwitchWarning;

        if (cancelled) return;

        if (warning.willClearCart) {
          setSwitchWarning(warning);
          setIsLoadingMenu(false);
          return;
        }
      } catch {
        // If switch check fails, continue loading the menu silently.
      }

      if (!cancelled) {
        setIsSwitchCheckDone(true);
        await loadMenu(activeRestaurant);
      }
    }

    checkSwitchAndLoad();

    return () => {
      cancelled = true;
    };
  }, [isOpen, loadMenu, restaurant]);

  if (!restaurant) return null;

  const restaurantId = getRestaurantId(restaurant);
  const shouldShowDrawer = isOpen && (!switchWarning || isSwitchCheckDone);

  const handleKeepCart = () => {
    setSwitchWarning(null);
    onClose();
  };

  const handleClearAndContinue = async () => {
    clearCart();
    setSwitchWarning(null);
    setIsSwitchCheckDone(true);
    await loadMenu(restaurant);
  };

  return (
    <>
      {/* Restaurant switch warning */}
      {isOpen && switchWarning && !isSwitchCheckDone && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">
          <div className="glass-strong w-full max-w-md rounded-3xl p-6 shadow-2xl animate-scale-in">
            <h3 className="text-xl font-bold text-white">Clear current cart?</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              Your cart has {switchWarning.currentItemCount} items from{" "}
              <span className="font-semibold text-white">
                {switchWarning.currentRestaurantName}
              </span>{" "}
              (₹{switchWarning.currentTotal}). Opening this menu will clear your
              cart. Continue?
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleKeepCart}
                className="flex-1 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-muted transition-colors hover:border-white/30 hover:text-white"
              >
                Keep my cart
              </button>
              <button
                onClick={handleClearAndContinue}
                className="flex-1 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Clear cart & continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          shouldShowDrawer ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[60] flex h-[85vh] flex-col sm:left-auto sm:top-0 sm:h-full sm:w-[480px] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          shouldShowDrawer
            ? "translate-y-0 sm:translate-x-0"
            : "translate-y-full sm:translate-y-0 sm:translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col glass-strong sm:border-l border-glass-border sm:rounded-none rounded-t-[2.5rem] overflow-hidden">
          
          {/* Header Image & Close */}
          <div className="relative h-48 shrink-0">
            <Image
              src={restaurant.image}
              alt={restaurant.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full glass hover:bg-white/20 transition-colors"
            >
              <X size={18} className="text-white" />
            </button>

            <div className="absolute bottom-4 left-5 right-5">
              <h2 className="text-2xl font-bold text-white">{restaurant.name}</h2>
              <p className="text-sm text-white/80">{restaurant.cuisine}</p>
            </div>
          </div>

          {/* Restaurant Stats Bar */}
          <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-4 shrink-0">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                {restaurant.rating}
              </div>
              <p className="text-[10px] text-muted">{restaurant.reviews} ratings</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Clock size={14} className="text-blue-400" />
                {restaurant.deliveryTime}
              </div>
              <p className="text-[10px] text-muted">Delivery</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <MapPin size={14} className="text-accent" />
                {restaurant.distance}
              </div>
              <p className="text-[10px] text-muted">Distance</p>
            </div>
          </div>

          {/* Menu Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6">
            {isLoadingMenu ? (
              <div className="space-y-5">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex gap-4 border-b border-border/50 pb-6 last:border-0 last:pb-0 animate-pulse"
                  >
                    <div className="flex-1">
                      <div className="mb-3 h-4 w-4 rounded-sm bg-white/10" />
                      <div className="h-4 w-3/4 rounded bg-white/10" />
                      <div className="mt-3 h-3 w-20 rounded bg-white/10" />
                      <div className="mt-4 h-3 w-full rounded bg-white/10" />
                      <div className="mt-2 h-3 w-2/3 rounded bg-white/10" />
                    </div>
                    <div className="h-9 w-28 rounded-xl bg-white/10" />
                  </div>
                ))}
              </div>
            ) : (
              sections.map((section) => (
                <div key={section.name} className="mb-8 last:mb-0">
                  <h3 className="mb-4 text-lg font-bold text-foreground flex items-center gap-2">
                    {section.name}
                    <span className="text-xs font-normal text-muted bg-surface px-2 py-0.5 rounded-full">
                      {section.items.length}
                    </span>
                  </h3>
                  
                  <div className="space-y-6">
                    {section.items.map((baseItem, itemIndex) => {
                      const item = {
                        ...baseItem,
                        bestseller:
                          (baseItem as DrawerMenuItem).bestseller ??
                          isBestseller(baseItem, itemIndex, section.name),
                      };
                      const cartId = `${item.name}::${restaurant.name}`;
                      const cartItem = cartItems.find((i) => i.id === cartId);
                      const qty = cartItem?.qty || 0;

                      return (
                        <div key={item.itemId || `${section.name}-${item.name}`} className="flex gap-4 border-b border-border/50 pb-6 last:border-0 last:pb-0">
                          <div className="flex-1">
                            {/* Veg/Non-Veg Badge */}
                            <div className={`mb-1.5 flex h-4 w-4 items-center justify-center border ${item.isVeg ? "border-green-500" : "border-red-500"} rounded-sm`}>
                              <div className={`h-2 w-2 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                            </div>

                            <h4 className="text-sm font-bold text-foreground">{item.name}</h4>
                            <p className="mt-1 text-sm font-semibold text-foreground">₹{item.price}</p>
                            
                            {item.bestseller && (
                              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                                <Flame size={10} /> BESTSELLER
                              </span>
                            )}

                            <p className="mt-2 line-clamp-2 text-xs text-muted leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          {/* Add to Cart Control */}
                          <div className="relative w-28 shrink-0 pt-2">
                            <div className="absolute inset-x-0 -top-2 flex justify-center">
                              <div className="relative w-full rounded-xl bg-surface border border-border shadow-lg overflow-hidden">
                                {qty === 0 ? (
                                  <button
                                    onClick={() => addItem({
                                      itemId: item.itemId || `${restaurantId}-${item.name}`,
                                      restaurantId,
                                      name: item.name,
                                      restaurant: restaurant.name,
                                      price: item.price,
                                      image: item.imageUrl || restaurant.image,
                                    })}
                                    className="w-full py-2 text-sm font-bold text-accent hover:bg-accent/5 transition-colors uppercase tracking-wide"
                                  >
                                    Add
                                  </button>
                                ) : (
                                  <div className="flex items-center justify-between bg-accent text-white px-2 py-1.5">
                                    <button
                                      onClick={() => decrementItem(cartId)}
                                      className="flex h-6 w-6 items-center justify-center hover:bg-white/20 rounded transition-colors"
                                    >
                                      <Minus size={14} />
                                    </button>
                                    <span className="text-sm font-bold w-4 text-center">{qty}</span>
                                    <button
                                      onClick={() => incrementItem(cartId)}
                                      className="flex h-6 w-6 items-center justify-center hover:bg-white/20 rounded transition-colors"
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </>
  );
}
