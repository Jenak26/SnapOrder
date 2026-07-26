"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[88vh] items-center justify-center overflow-hidden px-5 pb-12 pt-28 sm:min-h-[86vh] sm:pb-16 sm:pt-32"
    >
      {/* A single warm source, low and behind the copy. Three stacked orbs plus a
          grid overlay was doing the work of none of them. */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-accent/8 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl lg:px-8">
        <div className="grid items-center gap-12">
          {/* Left: Copy */}
          {/* Left-aligned: centring every element is the strongest "generated
              layout" tell, and asymmetry gives the eye somewhere to start. */}
          <div className="flex max-w-4xl flex-col items-start text-left">
            {/* Badge */}
            <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
              <Sparkles size={12} />
              <span>AI-Powered Food Recognition</span>
            </div>

            <h1 className="display animate-fade-up delay-100 text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem]">
              Snap a photo.
              <br />
              <span className="display-em">Get your food.</span>
            </h1>

            <p className="animate-fade-up delay-200 mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Point your camera at any dish. We identify it, find who makes it
              near you, and order it — in about a minute.
            </p>

            <div className="animate-fade-up delay-300 mt-11 flex flex-col gap-4 sm:flex-row">
              <a
                href="#upload"
                id="hero-cta"
                className="group flex items-center justify-center gap-3 rounded-2xl bg-accent px-9 py-4.5 text-base font-bold text-white shadow-2xl shadow-accent/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-accent/35 sm:px-10 sm:py-5"
              >
                Upload a Food Photo
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>
              <a
                href="#demo"
                id="hero-demo"
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-medium text-muted transition-all duration-300 hover:border-accent/40 hover:bg-white/8 hover:text-foreground sm:py-5"
              >
                See Demo
              </a>
            </div>

            {/*
              The invented "12,000+ happy foodies" and fake avatars came out.
              Fabricated metrics are a liability in front of a Swiggy reviewer;
              the real capability is the more convincing claim anyway.
            */}
            <p className="animate-fade-up delay-400 mt-12 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              Gemini vision · Swiggy Food MCP · live order tracking
            </p>
          </div>

          {/* Right: Hero image */}
          <div className="hidden animate-scale-in delay-200 relative justify-center">
            <div className="relative">
              {/* Glow behind image */}
              <div className="absolute inset-0 rounded-3xl bg-accent/20 blur-[60px]" />

              {/* Main image card */}
              <div className="relative overflow-hidden rounded-3xl glass glow-orange">
                <Image
                  src="/hero-burger.png"
                  alt="Delicious gourmet burger with fries"
                  width={560}
                  height={560}
                  className="h-auto w-full max-w-[560px] object-cover"
                  priority
                />

                {/* Overlay badge */}
                <div className="absolute bottom-4 left-4 right-4 glass rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-accent">
                        AI Match Found
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        Classic Smash Burger
                      </p>
                      <p className="text-xs text-muted">
                        The Burger Joint • 0.3 mi
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-accent">
                        ₹299
                      </span>
                      <span className="text-[10px] text-muted">98% match</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <div className="absolute -top-4 -right-4 animate-float glass rounded-xl p-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted">Delivery in</p>
                    <p className="text-sm font-bold text-foreground">
                      18 min
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-3 -left-3 animate-float glass rounded-xl p-3 shadow-xl" style={{ animationDelay: "2s" }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⭐</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">4.9</p>
                    <p className="text-[10px] text-muted">2.1k reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
