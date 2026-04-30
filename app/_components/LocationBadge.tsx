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

  return (
    <div className="flex w-fit items-center gap-2 rounded-full border border-border bg-black/40 px-3 py-1.5 text-xs font-medium backdrop-blur-md">
      <MapPin size={12} className={status === "fallback" ? "text-accent" : "text-white/60"} />
      
      <span className={status === "fallback" ? "text-accent" : "text-white/80"}>
        {status === "requesting" && "Detecting location..."}
        {status === "granted" && city}
        {status === "fallback" && `${city} (default)`}
        {status === "denied" && `${city} (default)`}
      </span>

      <button
        onClick={() => onRequestRefresh()}
        disabled={status === "requesting"}
        className="ml-1 rounded-full p-0.5 text-white/40 transition-colors hover:text-white disabled:opacity-50 disabled:animate-spin"
        title="Refresh Location"
      >
        <RefreshCw size={12} />
      </button>
    </div>
  );
}
