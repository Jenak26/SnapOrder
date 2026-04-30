"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

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

  const acknowledge = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 px-4 pb-3 sm:bottom-6 sm:px-6">
      <div className="mx-auto max-w-3xl animate-fade-up rounded-3xl border border-orange-400/30 bg-black/80 p-4 shadow-2xl shadow-orange-950/30 backdrop-blur-2xl sm:flex sm:items-center sm:gap-4 sm:p-5">
        <p className="text-sm leading-relaxed text-white/78">
          SnapOrder uses Swiggy&apos;s platform to find restaurants and place
          orders. Your location is used only to find nearby restaurants and is
          never stored on our servers. Order data is governed by Swiggy&apos;s
          privacy policy.
        </p>
        <div className="mt-4 flex shrink-0 items-center gap-3 sm:mt-0">
          <Link
            href="/privacy"
            className="text-sm font-semibold text-orange-300 transition-colors hover:text-orange-200"
          >
            Learn more -&gt;
          </Link>
          <button
            type="button"
            onClick={acknowledge}
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-400"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
