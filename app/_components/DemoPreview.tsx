"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ShoppingBag, Clock, Star, Utensils, Check } from "lucide-react";
import type { MatchResult, AnalyzeImageResult } from "@/app/_lib/types";
import { useCartStore, parsePrice } from "@/app/_lib/cartStore";

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
  const isLive = results && results.length > 0;

  const next = () => setActiveIdx((i) => (i + 1) % displayResults.length);
  const prev = () =>
    setActiveIdx((i) => (i - 1 + displayResults.length) % displayResults.length);

  // Reset activeIdx if results change length
  const safeIdx = activeIdx >= displayResults.length ? 0 : activeIdx;
  const result = displayResults[safeIdx];

  return (
    <section id="demo" className="relative py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
        {/* Section header */}
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {isLive ? (
              <>Your <span className="text-accent">Matches</span></>
            ) : (
              <>See It In <span className="text-accent">Action</span></>
            )}
          </h2>
          <p className="mt-3 text-base text-muted">
            {isLive
              ? "Here are the dishes that match your uploaded photo"
              : "Here\u0027s what happens after you upload a photo"}
          </p>

          {/* Analysis pill strip */}
          {isLive && analysis && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 animate-fade-up">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3.5 py-1.5 text-xs font-semibold text-accent">
                <Utensils size={12} />
                {analysis.dish_name}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-3.5 py-1.5 text-xs font-medium text-foreground">
                {Math.round(analysis.confidence * 100)}% confident
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-3.5 py-1.5 text-xs font-medium text-muted">
                {analysis.cuisine}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-3.5 py-1.5 text-xs font-medium text-muted">
                &ldquo;{analysis.search_query}&rdquo;
              </span>
            </div>
          )}
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-5 lg:gap-16">
          {/* Left: Demo phone / image */}
          <div className="lg:col-span-2 flex justify-center">
            <div className="relative w-full max-w-[320px]">
              <div className="overflow-hidden rounded-3xl glass glow-orange">
                <Image
                  src={result.image}
                  alt={result.name}
                  width={320}
                  height={400}
                  className="h-[400px] w-full object-cover transition-all duration-500"
                />
                {/* Match percentage overlay */}
                <div className="absolute top-4 right-4 glass rounded-full px-3 py-1.5">
                  <span className="text-xs font-bold text-accent">
                    {result.match}% Match
                  </span>
                </div>

                {/* Live badge */}
                {isLive && (
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-green-500/90 px-2.5 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                      Live
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Result card */}
          <div className="lg:col-span-3">
            <div className="glass rounded-3xl p-8">
              {/* Navigation */}
              <div className="mb-6 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  {isLive ? "Your Match" : "AI Match Result"} • {safeIdx + 1}/{displayResults.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={prev}
                    id="demo-prev"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={next}
                    id="demo-next"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Result info */}
              <h3 className="text-2xl font-bold text-foreground sm:text-3xl">
                {result.name}
              </h3>
              <p className="mt-1.5 text-sm text-muted">
                {result.restaurant} • {result.distance}
              </p>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-surface p-4 text-center">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Star size={14} />
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {result.rating}
                  </p>
                  <p className="text-[10px] text-muted">Rating</p>
                </div>
                <div className="rounded-2xl bg-surface p-4 text-center">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
                    <Clock size={14} />
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {result.deliveryTime}
                  </p>
                  <p className="text-[10px] text-muted">Delivery</p>
                </div>
                <div className="rounded-2xl bg-surface p-4 text-center">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <ShoppingBag size={14} />
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {result.price}
                  </p>
                  <p className="text-[10px] text-muted">Price</p>
                </div>
              </div>

              {/* CTA */}
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
                className={`mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white transition-all duration-300 ${
                  justAdded === result.name
                    ? "bg-success"
                    : "bg-accent hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20"
                }`}
              >
                {justAdded === result.name ? (
                  <>
                    <Check size={16} />
                    Added!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    Add to Cart — {result.price}
                  </>
                )}
              </button>

              {/* Dots indicator */}
              <div className="mt-6 flex justify-center gap-2">
                {displayResults.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === safeIdx
                        ? "w-6 bg-accent"
                        : "w-1.5 bg-border hover:bg-muted"
                    }`}
                    aria-label={`View result ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
