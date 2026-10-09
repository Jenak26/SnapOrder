"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, Plus, Check, ArrowUpRight } from "lucide-react";
import type { AnalyzeImageResult } from "@/app/_lib/types";
import { useCartStore } from "@/app/_lib/cartStore";
import MenuDrawer from "./MenuDrawer";
import {
  type Restaurant,
  defaultRestaurants,
  generateRecommendations,
} from "@/app/_lib/mockRestaurants";
import SwiggyAttribution from "./SwiggyAttribution";
import SectionHead from "./SectionHead";

interface Props {
  analysis?: AnalyzeImageResult | null;
}

export default function RestaurantCards({ analysis }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(
    null
  );

  let currentRestaurants = defaultRestaurants;
  let dishLine: React.ReactNode = (
    <>
      Explore <span className="display-em">the menu.</span>
    </>
  );

  if (analysis) {
    currentRestaurants = generateRecommendations(
      analysis.dish_name,
      analysis.cuisine
    );
    dishLine = (
      <>
        Who cooks{" "}
        <span className="display-em">{analysis.dish_name.toLowerCase()}</span>
      </>
    );
  }

  return (
    <section id="restaurants" className="relative px-5 py-24 sm:py-32 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <SectionHead
          index="03"
          eyebrow="Restaurant inspiration"
          title={dishLine}
          lede="Browse sample restaurants and dishes. Ask the ordering assistant to check current availability on Swiggy."
        />

        {currentRestaurants.length === 0 ? (
          <div
            data-reveal
            className="border border-rule bg-card px-8 py-24 text-center"
          >
            <p className="serif text-[28px] text-ink">Nothing nearby, yet</p>
            <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-ink-2">
              No kitchen near you is currently serving{" "}
              <span className="font-semibold text-chilli">
                {analysis?.dish_name}
              </span>
              . Try another photograph, or ask the agent for something close to
              it.
            </p>
          </div>
        ) : (
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {currentRestaurants.map((r, i) => {
              const added = justAdded === r.popular;
              return (
                <article
                  key={r.name}
                  id={`restaurant-card-${i}`}
                  data-reveal
                  style={{ transitionDelay: `${(i % 3) * 90}ms` }}
                  onClick={() => setSelectedRestaurant(r)}
                  className="group cursor-pointer"
                >
                  {/* Plate */}
                  <div className="photo-tint relative aspect-[5/4] overflow-hidden border border-ink/12">
                    <Image
                      src={r.image}
                      alt={r.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="photo-warm object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                    />

                    <span className="numeral absolute left-3 top-2 text-[42px] leading-none text-card mix-blend-difference">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    {r.badge && (
                      <span className="label absolute right-3 top-3 bg-chilli px-2 py-1 text-[9px] text-card">
                        {r.badge}
                      </span>
                    )}

                    <span className="absolute bottom-0 right-0 flex items-center gap-1.5 bg-card px-2.5 py-1.5">
                      <Star size={11} className="fill-turmeric text-turmeric" />
                      <span className="mono text-[11px] font-semibold text-ink">
                        {r.rating}
                      </span>
                      <span className="mono text-[10px] text-ink-3">
                        ({r.reviews})
                      </span>
                    </span>
                  </div>

                  {/* Particulars */}
                  <div className="mt-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="serif text-[21px] leading-tight text-ink">
                        {r.name}
                      </h3>
                      <ArrowUpRight
                        size={17}
                        className="mt-1 shrink-0 text-ink-3 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-chilli"
                      />
                    </div>
                    <p className="label mt-1.5">{r.cuisine}</p>

                    {/* A rule that fills with ink on hover. */}
                    <div className="relative mt-4 h-px w-full bg-rule">
                      <span className="absolute inset-y-0 left-0 w-0 bg-chilli transition-all duration-500 ease-out group-hover:w-full" />
                    </div>

                    <div className="mono mt-3 flex items-center gap-3 text-[11px] text-ink-2">
                      <span>{r.deliveryTime}</span>
                      <span className="text-ink-3">·</span>
                      <span>{r.distance}</span>
                      <span className="text-ink-3">·</span>
                      <span>{r.priceRange}</span>
                      <SwiggyAttribution variant="inline" className="ml-auto" />
                    </div>

                    {/* Most popular — one-tap add without opening the menu. */}
                    <div className="mt-4 flex items-center justify-between gap-4 bg-paper-2 px-4 py-3">
                      <div className="min-w-0">
                        <p className="label text-[9px]">Most ordered</p>
                        <p className="mt-1 truncate text-[13px] font-medium text-ink">
                          {r.popular}
                        </p>
                      </div>
                      <button
                        aria-label={`Add ${r.popular} to cart`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Price bands map from the ₹ symbol count.
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
                        /* 44px on touch: this is the primary conversion action
                           on the card and was below the minimum tap target. */
                        className={`btn-press-sm flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-card sm:h-10 sm:w-10 ${
                          added ? "bg-cardamom" : "bg-chilli hover:bg-chilli-2"
                        }`}
                      >
                        {added ? (
                          <Check size={15} strokeWidth={3} />
                        ) : (
                          <Plus size={15} strokeWidth={3} />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
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

