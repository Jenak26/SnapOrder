"use client";

import Link from "next/link";
import { useRef, useSyncExternalStore } from "react";
import { useDockHeight } from "@/app/_hooks/useDockHeight";

const STORAGE_KEY = "snaporder-privacy-acknowledged";
const CHANGE_EVENT = "snaporder-privacy-change";

const subscribe = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
};

const getSnapshot = () => localStorage.getItem(STORAGE_KEY) !== "true";
const getServerSnapshot = () => false;

export default function PrivacyNotice() {
  const isVisible = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const ref = useRef<HTMLDivElement>(null);

  // Sits at the very bottom of the dock; everything else stacks above it.
  useDockHeight(ref, "--dock-privacy", isVisible);

  const acknowledge = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div ref={ref} className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-4">
      <div className="animate-rise mx-auto flex max-w-3xl flex-col gap-3 bg-ink px-4 py-3.5 text-paper shadow-[0_20px_50px_-20px_rgba(22,18,14,0.8)] sm:flex-row sm:items-center sm:gap-6 sm:px-5 sm:py-4">
        <p className="label shrink-0 text-paper/45">Note</p>
        <p className="flex-1 text-[12.5px] leading-relaxed text-paper/75 sm:text-[13px]">
          Your photo is read and discarded, never stored. Your location is used
          only to find nearby kitchens. Orders are handled by Swiggy under their
          privacy policy.
        </p>
        <div className="flex shrink-0 items-center justify-between gap-4">
          <Link
            href="/privacy"
            className="link-draw py-2 text-[13px] font-medium text-paper/70 hover:text-paper"
          >
            Details
          </Link>
          <button
            type="button"
            onClick={acknowledge}
            className="btn-press-sm rounded-full bg-chilli px-6 py-2.5 text-[13px] font-semibold text-card hover:bg-chilli-2"
            style={{ boxShadow: "2px 2px 0 #f2ece1" }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
