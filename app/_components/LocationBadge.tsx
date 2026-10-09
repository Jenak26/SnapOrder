"use client";

import { RefreshCw, MapPin } from "lucide-react";
import type { GeolocationStatus } from "@/app/_hooks/useGeolocation";

interface Props {
  status: GeolocationStatus;
  city: string;
  onRequestRefresh: () => void;
}

export default function LocationBadge({ status, city, onRequestRefresh }: Props) {
  if (status === "idle") return null;

  const approximate = status === "fallback";

  return (
    <div className="flex w-fit items-center gap-2 rounded-full border border-rule bg-card py-1.5 pl-3 pr-1.5">
      <MapPin
        size={12}
        strokeWidth={2}
        className={approximate ? "text-turmeric" : "text-chilli"}
      />

      {/* The city name alone reads as a working location; the refresh control
          is the affordance for correcting it. */}
      <span className="mono text-[11px] font-medium text-ink">
        {status === "requesting" ? "Locating…" : city}
      </span>

      {approximate && <span className="label text-[9px]">approx</span>}

      {/* The visible dot stays small to keep the badge quiet, but the hit area
          is padded out to a real tap target on touch. */}
      <button
        onClick={() => onRequestRefresh()}
        disabled={status === "requesting"}
        className="-my-2 -mr-1.5 flex h-10 w-10 items-center justify-center rounded-full text-ink-3 transition-colors hover:text-ink disabled:animate-spin-slow disabled:opacity-60 sm:-my-1 sm:h-7 sm:w-7"
        title="Refresh location"
        aria-label="Refresh location"
      >
        <RefreshCw size={12} />
      </button>
    </div>
  );
}
