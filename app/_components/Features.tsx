"use client";

import {
  Camera,
  Sparkles,
  ShoppingBag,
  Truck,
  Zap,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Snap Any Food",
    description:
      "Take a photo of any dish — from a menu, social media, or real life. Our AI handles it all.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Matching",
    description:
      "Advanced computer vision instantly identifies the dish and finds the best matches near you.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: ShoppingBag,
    title: "One-Tap Ordering",
    description:
      "Add to cart, customize, and checkout in seconds. No more scrolling through endless menus.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description:
      "Real-time tracking with an average delivery time of 20 minutes from our partner restaurants.",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "From photo to order in under 10 seconds. Our infrastructure is built for speed.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Shield,
    title: "Quality Guaranteed",
    description:
      "Every restaurant is vetted. If you're not satisfied, we'll make it right — no questions asked.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-28 sm:py-36">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
        {/* Section header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
            <Zap size={12} />
            <span>How It Works</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Food ordering,{" "}
            <span className="text-accent">reimagined</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted sm:text-lg">
            We combined computer vision AI with the best local restaurants to
            create the fastest way to go from craving to eating.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                id={`feature-${i}`}
                className="group relative rounded-3xl glass p-7 transition-all duration-500 hover:glow-orange hover:-translate-y-1"
              >
                {/* Shimmer on hover */}
                <div className="absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 animate-shimmer" />

                <div className="relative z-10">
                  <div
                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${f.bg} ${f.color} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {f.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
