"use client";

import { useState, useSyncExternalStore } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/app/_lib/cartStore";
import SwiggyConnectButton from "./SwiggyConnectButton";
import Wordmark from "./Wordmark";

const subscribeHydration = () => () => {};
const navLinks = [
  { label: "Upload", href: "#upload" },
  { label: "Matches", href: "#demo" },
  { label: "Restaurants", href: "#restaurants" },
  { label: "How it works", href: "#method" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const itemCount = useCartStore((s) => s.itemCount);
  const toggleSidebar = useCartStore((s) => s.toggleSidebar);
  const count = mounted ? itemCount() : 0;



  return (
    <header
      id="navbar"
      className="fixed inset-x-0 top-0 z-50"
    >
      {/* A masthead rule rather than a floating pill. The pill is the single
          most recognisable AI-landing-page shape; a full-bleed hairline is
          what a printed masthead actually does. */}
      <div
        className="absolute inset-x-0 bottom-0 h-px bg-rule"
      />

      <nav className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between gap-3 px-5 lg:px-10">
        <a href="#" id="navbar-logo" className="group -my-2 flex items-center gap-3 py-2">
          <Wordmark />
        </a>

        <div className="hidden items-center gap-6 xl:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="link-draw text-[13px] font-medium text-ink-2 transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden xl:block"><SwiggyConnectButton /></div>

          <button
            id="navbar-cart"
            onClick={toggleSidebar}
            className="relative flex h-10 items-center gap-2 rounded-full border border-rule px-3.5 text-ink transition-colors hover:border-ink hover:bg-card"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <ShoppingBag size={16} strokeWidth={1.75} />
            <span className="mono text-xs font-medium tabular-nums">
              {String(count).padStart(2, "0")}
            </span>
          </button>

          <a
            href="#upload"
            id="navbar-cta"
            className="btn-press-sm hidden rounded-full bg-chilli px-5 py-2.5 text-[13px] font-semibold tracking-tight text-card hover:bg-chilli-2 sm:block"
          >
            Snap a dish
          </a>

          <button
            id="navbar-mobile-toggle"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-rule text-ink xl:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile navigation */}
      <div
        id="mobile-navigation"
        inert={!mobileOpen}
        className={`overflow-hidden border-t border-rule bg-paper transition-[max-height] duration-400 xl:hidden ${
          mobileOpen ? "max-h-[420px]" : "max-h-0 border-t-0"
        }`}
      >
        <div className="px-5 py-3">
          <SwiggyConnectButton />
          {navLinks.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-baseline gap-4 border-b border-rule-soft py-3.5 last:border-0"
            >
              <span className="mono text-[10px] text-ink-3">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="serif text-xl text-ink">{link.label}</span>
            </a>
          ))}
          <a
            href="#upload"
            onClick={() => setMobileOpen(false)}
            className="btn-press-sm mt-4 mb-2 block rounded-full bg-chilli py-3 text-center text-sm font-semibold text-card"
          >
            Snap a dish
          </a>
        </div>
      </div>
    </header>
  );
}


