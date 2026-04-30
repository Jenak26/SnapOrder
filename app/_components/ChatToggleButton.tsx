"use client";

import { MessageCircle } from "lucide-react";
import { useCartStore } from "@/app/_lib/cartStore";
import { useEffect, useState } from "react";

interface Props {
  onClick: () => void;
  hasAnalysisContext: boolean;
}

export default function ChatToggleButton({ onClick, hasAnalysisContext }: Props) {
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((state) => state.itemCount());
  const count = mounted ? itemCount : 0;
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // If we have items in cart, StickyCart is visible on mobile (~80px tall).
  // So we move the button up on mobile.
  const bottomPosition = count > 0 ? "bottom-28 md:bottom-8" : "bottom-6 md:bottom-8";

  return (
    <button
      onClick={onClick}
      className={`fixed right-5 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-accent to-amber-500 px-4 py-3.5 text-white shadow-2xl shadow-accent/25 transition-all hover:scale-105 active:scale-95 md:right-8 ${bottomPosition} animate-fade-up`}
    >
      <div className="relative">
        <MessageCircle size={22} className="fill-white/10" />
        {hasAnalysisContext && (
          <>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-white border-2 border-accent"></span>
            </span>
          </>
        )}
      </div>
      <span className="hidden font-semibold md:inline-block">Chat with AI</span>
    </button>
  );
}
