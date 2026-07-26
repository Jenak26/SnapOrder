"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Clock, MapPin, Plus, Check } from "lucide-react";
import type { AnalyzeImageResult } from "@/app/_lib/types";
import { useCartStore } from "@/app/_lib/cartStore";
import MenuDrawer from "./MenuDrawer";
import {
  type Restaurant,
  defaultRestaurants,
  generateRecommendations,
} from "@/app/_lib/mockRestaurants";
import SwiggyAttribution from "./SwiggyAttribution";

interface Props {
  analysis?: AnalyzeImageResult | null;
}

export default function RestaurantCards({ analysis }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  let currentRestaurants = defaultRestaurants;
  let titlePrefix = "Top";
  const titleSuffix = "Near You";

  if (analysis) {
    const dish = analysis.dish_name;
    const cuisine = analysis.cuisine;
    currentRestaurants = generateRecommendations(dish, cuisine);
    titlePrefix = `Top ${dish}`;
  }
  return (
    <section id="restaurants" className="relative py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
        {/* Section header */}
        <div className="mb-14 max-w-2xl">
          <p className="eyebrow mb-4">Nearby</p>
          <h2 className="display text-4xl sm:text-5xl">
            {titlePrefix} <span className="display-em">restaurants</span> {titleSuffix.toLowerCase()}
          </h2>
          <p className="mt-4 text-base text-muted">
            Live from Swiggy, ranked by how well they match your dish.
          </p>
        </div>

        {currentRestaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-3xl">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-surface">
              <MapPin size={32} className="text-muted" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No restaurants found</h3>
            <p className="mt-2 text-sm text-muted max-w-md">
              We couldn&apos;t find any restaurants serving <span className="font-semibold text-accent">{analysis?.dish_name}</span> near your location. Try searching for something else.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {currentRestaurants.map((r, i) => (
            <div
              key={r.name}
              id={`restaurant-card-${i}`}
              onClick={() => setSelectedRestaurant(r)}
              className="group glass rounded-3xl overflow-hidden transition-all duration-500 hover:glow-orange hover:-translate-y-1 cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={r.image}
                  alt={r.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {r.badge && (
                  <div className="absolute top-3 left-3 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    {r.badge}
                  </div>
                )}

                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full glass px-2.5 py-1">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold text-white">
                    {r.rating}
                  </span>
                  <span className="text-[10px] text-white/60">
                    ({r.reviews})
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-base font-bold text-foreground truncate">
                  {r.name}
                </h3>
                <p className="mt-1 text-xs text-muted truncate">{r.cuisine}</p>

                <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {r.deliveryTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {r.distance}
                  </span>
                  <span>{r.priceRange}</span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <SwiggyAttribution variant="inline" />
                </div>

                {/* Popular dish */}
                <div className="mt-4 flex items-center justify-between rounded-xl bg-surface p-3">
                  <div>
                    <p className="text-[10px] text-muted">Most Popular</p>
                    <p className="text-sm font-medium text-foreground">
                      {r.popular}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Extract price from priceRange symbol count (₹ = ~200, ₹₹ = ~350, ₹₹₹ = ~500)
                      const priceMap: Record<string, number> = {
                        "₹": 199,
                        "₹₹": 349,
                        "₹₹₹": 499,
                      };
                      addItem({
                        name: r.popular,
                        restaurant: r.name,
                        price: priceMap[r.priceRange] ?? 299,
                        image: r.image,
                      });
                      setJustAdded(r.popular);
                      setTimeout(() => setJustAdded(null), 1200);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-white transition-all duration-300 ${
                      justAdded === r.popular
                        ? "bg-success scale-110"
                        : "bg-accent hover:scale-110"
                    }`}
                  >
                    {justAdded === r.popular ? (
                      <Check size={14} />
                    ) : (
                      <Plus size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      <MenuDrawer
        isOpen={!!selectedRestaurant}
        onClose={() => setSelectedRestaurant(null)}
        restaurant={selectedRestaurant}
      />
    </section>
  );
}
