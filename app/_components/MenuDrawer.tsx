"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { X, Star, Minus, Plus } from "lucide-react";
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

/** The FSSAI-style veg/non-veg mark, drawn properly rather than as a dot. */
function VegMark({ isVeg }: { isVeg?: boolean }) {
  const color = isVeg ? "#2f6b4c" : "#b3271a";
  return (
    <span
      className="flex h-[13px] w-[13px] shrink-0 items-center justify-center border"
      style={{ borderColor: color }}
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span
        className="h-[6px] w-[6px] rounded-full"
        style={{ background: color }}
      />
    </span>
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
          `/api/cart/switch-check?restaurantId=${encodeURIComponent(restaurantId)}`
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/65 px-5 backdrop-blur-[3px]">
          <div className="animate-sheet-up w-full max-w-md bg-card p-7 shadow-[0_30px_80px_-30px_rgba(22,18,14,0.75)]">
            <p className="label label-chilli">One kitchen at a time</p>
            <h3 className="serif mt-2 text-[28px] leading-tight text-ink">
              Clear your current bill?
            </h3>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-2">
              You have {switchWarning.currentItemCount} item
              {switchWarning.currentItemCount === 1 ? "" : "s"} from{" "}
              <span className="font-semibold text-ink">
                {switchWarning.currentRestaurantName}
              </span>{" "}
              (₹{switchWarning.currentTotal}). Swiggy carts hold one kitchen, so
              opening this menu empties that one.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleKeepCart}
                className="btn-press-sm flex-1 rounded-full border border-ink bg-card px-4 py-3 text-[14px] font-semibold text-ink"
              >
                Keep my bill
              </button>
              <button
                onClick={handleClearAndContinue}
                className="btn-press-sm flex-1 rounded-full bg-chilli px-4 py-3 text-[14px] font-semibold text-card hover:bg-chilli-2"
              >
                Clear &amp; continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-ink/55 backdrop-blur-[3px] transition-opacity duration-300 ${
          shouldShowDrawer ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[60] flex h-[88vh] flex-col bg-card transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:left-auto sm:top-0 sm:h-full sm:w-[500px] ${
          shouldShowDrawer
            ? "translate-y-0 sm:translate-x-0"
            : "translate-y-full sm:translate-y-0 sm:translate-x-full"
        }`}
      >
        {/* Plate */}
        <div className="photo-tint relative h-44 shrink-0 overflow-hidden">
          <Image
            src={restaurant.image}
            alt={restaurant.name}
            fill
            sizes="500px"
            className="photo-warm object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />

          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-card text-ink transition-colors hover:bg-chilli hover:text-card sm:h-9 sm:w-9"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>

          <div className="absolute inset-x-5 bottom-4">
            <p className="label text-paper/60">{restaurant.cuisine}</p>
            <h2 className="serif mt-1 text-[30px] leading-none text-paper">
              {restaurant.name}
            </h2>
          </div>
        </div>

        {/* Stats rail */}
        <dl className="mono grid shrink-0 grid-cols-3 border-b border-rule">
          <div className="border-r border-rule px-4 py-3">
            <dt className="label text-[9px]">Rating</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              <Star size={11} className="fill-turmeric text-turmeric" />
              {restaurant.rating}
            </dd>
          </div>
          <div className="border-r border-rule px-4 py-3">
            <dt className="label text-[9px]">Delivery</dt>
            <dd className="mt-1 text-[13px] font-semibold text-ink">
              {restaurant.deliveryTime}
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className="label text-[9px]">Distance</dt>
            <dd className="mt-1 text-[13px] font-semibold text-ink">
              {restaurant.distance}
            </dd>
          </div>
        </dl>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {isLoadingMenu ? (
            <div className="space-y-6">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse gap-4 border-b border-rule pb-6"
                >
                  <div className="flex-1 space-y-2.5">
                    <div className="h-3 w-3 bg-ink/10" />
                    <div className="h-3.5 w-2/3 bg-ink/10" />
                    <div className="h-3 w-16 bg-ink/10" />
                    <div className="h-2.5 w-full bg-ink/8" />
                  </div>
                  <div className="h-9 w-24 shrink-0 rounded-full bg-ink/10" />
                </div>
              ))}
            </div>
          ) : (
            sections.map((section) => (
              <section key={section.name} className="mb-9 last:mb-0">
                <div className="flex items-center gap-3">
                  <h3 className="label label-ink whitespace-nowrap">
                    {section.name}
                  </h3>
                  <span className="rule-h" />
                  <span className="mono text-[10px] text-ink-3">
                    {String(section.items.length).padStart(2, "0")}
                  </span>
                </div>

                <ul className="mt-4">
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
                      <li
                        key={item.itemId || `${section.name}-${item.name}`}
                        className="flex gap-5 border-b border-rule py-5 last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <VegMark isVeg={item.isVeg} />
                            {item.bestseller && (
                              <span className="label label-chilli text-[9px]">
                                Bestseller
                              </span>
                            )}
                          </div>

                          <h4 className="mt-2 text-[15px] font-medium leading-snug text-ink">
                            {item.name}
                          </h4>
                          <p className="mono mt-1 text-[13px] font-semibold text-ink">
                            ₹{item.price}
                          </p>
                          <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-ink-2">
                            {item.description}
                          </p>
                        </div>

                        <div className="shrink-0 pt-1">
                          {qty === 0 ? (
                            <button
                              onClick={() =>
                                addItem({
                                  itemId:
                                    item.itemId || `${restaurantId}-${item.name}`,
                                  restaurantId,
                                  name: item.name,
                                  restaurant: restaurant.name,
                                  price: item.price,
                                  image: item.imageUrl || restaurant.image,
                                })
                              }
                              className="btn-press-sm w-[92px] rounded-full border border-ink bg-card py-2.5 text-[13px] font-bold uppercase tracking-wide text-chilli sm:py-2"
                            >
                              Add
                            </button>
                          ) : (
                            <div className="flex w-[92px] items-center justify-between rounded-full bg-chilli px-1.5 py-1.5 text-card">
                              <button
                                onClick={() => decrementItem(cartId)}
                                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-card/20 sm:h-7 sm:w-7"
                                aria-label={`One fewer ${item.name}`}
                              >
                                <Minus size={13} strokeWidth={2.5} />
                              </button>
                              <span className="mono text-[13px] font-bold">
                                {qty}
                              </span>
                              <button
                                onClick={() => incrementItem(cartId)}
                                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-card/20 sm:h-7 sm:w-7"
                                aria-label={`One more ${item.name}`}
                              >
                                <Plus size={13} strokeWidth={2.5} />
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </>
  );
}
