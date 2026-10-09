"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, Plus } from "lucide-react";
import type { MatchResult, AnalyzeImageResult } from "@/app/_lib/types";
import { useCartStore, parsePrice } from "@/app/_lib/cartStore";
import SectionHead from "./SectionHead";

const fallbackResults: MatchResult[] = [
  {
    name: "Classic Smash Burger",
    restaurant: "The Burger Joint",
    distance: "0.3 mi",
    price: "₹299",
    match: 98,
    rating: 4.9,
    deliveryTime: "18 min",
    image: "/hero-burger.png",
  },
  {
    name: "Margherita Wood-Fired Pizza",
    restaurant: "Napoli Express",
    distance: "0.8 mi",
    price: "₹449",
    match: 87,
    rating: 4.7,
    deliveryTime: "25 min",
    image: "/food-pizza.png",
  },
  {
    name: "Salmon Poke Bowl",
    restaurant: "Aloha Bowl Co.",
    distance: "1.2 mi",
    price: "₹399",
    match: 82,
    rating: 4.8,
    deliveryTime: "22 min",
    image: "/food-pokebowl.png",
  },
];

interface Props {
  results?: MatchResult[];
  analysis?: AnalyzeImageResult | null;
}

export default function DemoPreview({ results, analysis }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  const displayResults = results && results.length > 0 ? results : fallbackResults;
  const isLive = Boolean(results && results.length > 0);

  const next = () => setActiveIdx((i) => (i + 1) % displayResults.length);
  const prev = () =>
    setActiveIdx((i) => (i - 1 + displayResults.length) % displayResults.length);

  // Reset activeIdx if results change length
  const safeIdx = activeIdx >= displayResults.length ? 0 : activeIdx;
  const result = displayResults[safeIdx];
  const added = justAdded === result.name;

  return (
    <section id="demo" className="relative px-5 py-24 sm:py-32 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <SectionHead
          index="02"
          eyebrow={isLive ? "Your results" : "Walkthrough"}
          title={
            isLive ? (
              <>
                What we <span className="display-em">found.</span>
              </>
            ) : (
              <>
                A taste of <span className="display-em">your matches.</span>
              </>
            )
          }
          lede={
            isLive
              ? "Ranked by visual match, then by how close the kitchen is to you."
              : "Explore sample dishes to see how matching works. Upload your photo for your own results."
          }
        />

        {/* ── Detection readout ─────────────────────────────── */}
        {isLive && analysis && (
          <dl
            data-reveal
            className="mono mb-10 grid gap-px overflow-hidden border border-rule bg-rule text-[11px] sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { k: "Dish", v: analysis.dish_name },
              { k: "Confidence", v: `${Math.round(analysis.confidence * 100)}%` },
              { k: "Cuisine", v: analysis.cuisine },
              { k: "Query", v: `"${analysis.search_query}"` },
            ].map((row) => (
              <div key={row.k} className="bg-card px-4 py-3.5">
                <dt className="label">{row.k}</dt>
                <dd className="mt-1.5 truncate text-[13px] font-medium text-ink">
                  {row.v}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div data-reveal className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          {/* ── The plate ───────────────────────────────────── */}
          <div className="lg:col-span-6">
            <div className="photo-tint relative overflow-hidden border border-ink/15 shadow-[0_28px_70px_-30px_rgba(22,18,14,0.55)]">
              <Image
                key={result.image}
                src={result.image}
                alt={result.name}
                width={880}
                height={660}
                className="photo-warm animate-rise aspect-[4/3] w-full object-cover"
              />

              {isLive && (
                <div className="absolute left-4 top-4 flex items-center gap-2 bg-card px-2.5 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-chilli animate-blink" />
                  <span className="label label-ink text-[9px]">Live</span>
                </div>
              )}

              <div className="absolute right-4 top-4 flex h-[78px] w-[78px] -rotate-[13deg] flex-col items-center justify-center bg-paper/85 text-chilli backdrop-blur-[2px] stamp">
                <span className="mono text-[20px] font-bold leading-none">
                  {result.match}
                </span>
                <span className="mt-0.5 text-[8px] font-bold leading-none">
                  % MATCH
                </span>
              </div>
            </div>

            {/* Contact sheet — switching plates is a visual choice, so show
                the plates rather than abstract dots. */}
            {displayResults.length > 1 && (
              <div className="mt-4 flex gap-3">
                {displayResults.map((r, i) => (
                  <button
                    key={`${r.name}-${i}`}
                    onClick={() => setActiveIdx(i)}
                    aria-label={`View ${r.name}`}
                    aria-current={i === safeIdx}
                    className={`relative h-16 w-20 overflow-hidden border transition-all duration-300 ${
                      i === safeIdx
                        ? "border-chilli opacity-100"
                        : "border-rule opacity-45 hover:opacity-80"
                    }`}
                  >
                    <Image
                      src={r.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── The particulars ─────────────────────────────── */}
          <div className="lg:col-span-6">
            <div className="flex items-center justify-between border-b border-rule pb-4">
              <span className="mono text-[11px] text-ink-3">
                <span className="text-ink">
                  {String(safeIdx + 1).padStart(2, "0")}
                </span>
                {" / "}
                {String(displayResults.length).padStart(2, "0")}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={prev}
                  id="demo-prev"
                  aria-label="Previous match"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-rule text-ink transition-colors hover:border-ink hover:bg-card sm:h-10 sm:w-10"
                >
                  <ArrowLeft size={15} />
                </button>
                <button
                  onClick={next}
                  id="demo-next"
                  aria-label="Next match"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-rule text-ink transition-colors hover:border-ink hover:bg-card sm:h-10 sm:w-10"
                >
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

            <h3 className="display mt-7 text-[2.5rem] leading-[0.95] sm:text-[3.25rem]">
              {result.name}
            </h3>
            <p className="mono mt-4 text-[12px] text-ink-2">
              {result.restaurant}
              <span className="mx-2 text-ink-3">·</span>
              {result.distance}
            </p>

            <dl className="mt-9 border-t border-rule">
              {[
                { k: "Rating", v: `${result.rating} / 5` },
                { k: "Delivery window", v: result.deliveryTime },
                { k: "Visual match", v: `${result.match}%` },
              ].map((row) => (
                <div
                  key={row.k}
                  className="flex items-baseline justify-between border-b border-rule py-3.5"
                >
                  <dt className="label">{row.k}</dt>
                  <dd className="mono text-[13px] font-medium text-ink">
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-9 flex items-end justify-between gap-6">
              <div>
                <p className="label">Price</p>
                <p className="numeral mt-1 text-[3.25rem] leading-none text-ink">
                  {result.price}
                </p>
              </div>

              <button
                id="demo-order"
                onClick={() => {
                  addItem({
                    name: result.name,
                    restaurant: result.restaurant,
                    price: parsePrice(result.price),
                    image: result.image,
                  });
                  setJustAdded(result.name);
                  setTimeout(() => setJustAdded(null), 1500);
                }}
                className={`btn-press flex shrink-0 items-center gap-2.5 rounded-full px-7 py-4 text-[15px] font-semibold text-card transition-colors ${
                  added ? "bg-cardamom" : "bg-chilli hover:bg-chilli-2"
                }`}
              >
                {added ? (
                  <>
                    <Check size={16} strokeWidth={2.5} />
                    In your cart
                  </>
                ) : (
                  <>
                    <Plus size={16} strokeWidth={2.5} />
                    Add to cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

