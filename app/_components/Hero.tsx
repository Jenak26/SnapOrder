"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[88vh] items-center justify-center overflow-hidden px-5 pb-12 pt-28 sm:min-h-[86vh] sm:pb-16 sm:pt-32"
    >
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-orange-600/8 blur-[100px]" />
        <div className="absolute top-1/3 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-amber-500/5 blur-[80px]" />
      </div>

      {/* Grid lines background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl lg:px-8">
        <div className="grid items-center gap-12">
          {/* Left: Copy */}
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            {/* Badge */}
            <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
              <Sparkles size={12} />
              <span>AI-Powered Food Recognition</span>
            </div>

            <h1 className="animate-fade-up delay-100 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Snap a Photo.
              <br />
              <span className="bg-gradient-to-r from-accent via-amber-400 to-accent bg-clip-text text-transparent animate-gradient">
                Get Your Food.
              </span>
            </h1>

            <p className="animate-fade-up delay-200 mt-7 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              Upload any food photo and our AI instantly finds the closest
              matching dish from top restaurants near you. From craving to
              doorstep in minutes.
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

            {/* Social proof */}
            <div className="animate-fade-up delay-400 mt-12 flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {[
                  "bg-gradient-to-br from-orange-400 to-red-500",
                  "bg-gradient-to-br from-blue-400 to-purple-500",
                  "bg-gradient-to-br from-green-400 to-teal-500",
                  "bg-gradient-to-br from-pink-400 to-rose-500",
                ].map((bg, i) => (
                  <div
                    key={i}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold text-white ${bg}`}
                  >
                    {["AK", "PS", "MR", "JD"][i]}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="font-semibold text-foreground">12,000+</span>{" "}
                <span className="text-muted">happy foodies</span>
              </div>
            </div>
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
