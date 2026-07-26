"use client";

import { useState, useEffect } from "react";
import {
  Camera,
  Menu,
  X,
  ShoppingCart,
  ChevronDown,
} from "lucide-react";
import { useCartStore } from "@/app/_lib/cartStore";
import SwiggyConnectButton from "./SwiggyConnectButton";

const navLinks = [
  { label: "How It Works", href: "#features" },
  { label: "Restaurants", href: "#restaurants" },
  { label: "Demo", href: "#demo" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount);
  const toggleSidebar = useCartStore((s) => s.toggleSidebar);
  const count = mounted ? itemCount() : 0;

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      id="navbar"
      className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 transition-all duration-500 sm:px-5"
    >
      <div
        className={`mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-black/55 px-4 shadow-2xl shadow-black/25 backdrop-blur-xl transition-all duration-500 sm:rounded-full sm:px-5 lg:px-6 ${
          scrolled ? "shadow-accent/10 ring-1 ring-white/5" : "shadow-black/20"
        }`}
      >
        {/* Logo */}
        <a
          href="#"
          id="navbar-logo"
          className="flex items-center gap-2.5 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-5deg]">
            <Camera size={18} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Snap<span className="text-accent">Order</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-white/8 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <SwiggyConnectButton />
          <button
            id="navbar-cart"
            onClick={toggleSidebar}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/5 text-muted transition-colors hover:border-white/20 hover:bg-white/10 hover:text-foreground"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <ShoppingCart size={18} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
          <a
            href="#upload"
            id="navbar-cta"
            className="hidden items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/15 transition-all duration-300 hover:bg-accent-hover hover:shadow-accent/25 sm:flex"
          >
            Order Now
            <ChevronDown size={14} className="rotate-[-90deg]" />
          </a>

          {/* Mobile toggle */}
          <button
            id="navbar-mobile-toggle"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-white/8 hover:text-foreground md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          mobileOpen ? "max-h-64 pb-4" : "max-h-0"
        }`}
      >
        <div className="mx-auto mt-2 flex max-w-7xl flex-col gap-1 rounded-2xl border border-white/10 bg-black/75 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-muted transition-colors hover:text-foreground hover:bg-white/5"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#upload"
            onClick={() => setMobileOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white"
          >
            Order Now
          </a>
        </div>
      </div>
    </nav>
  );
}
