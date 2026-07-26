"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Check, ChefHat, Bike, MapPin, X, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useCartStore } from "@/app/_lib/cartStore";
import { getLastSessionId } from "@/app/_lib/swiggySessionId";
import SwiggyAttribution from "./SwiggyAttribution";

interface Props {
  orderId: string;
  estimatedDelivery?: Date;
  restaurantName: string;
  onClose?: () => void;
}

const STAGES = [
  { id: 0, label: "Order Placed", icon: Check },
  { id: 1, label: "Being Prepared", icon: ChefHat },
  { id: 2, label: "Out for Delivery", icon: Bike },
  { id: 3, label: "Delivered", icon: MapPin },
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function OrderTracker({ orderId, estimatedDelivery, restaurantName, onClose }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [countdown, setCountdown] = useState<string>("...");
  const [issueReported, setIssueReported] = useState(false);
  
  const itemCount = useCartStore((s) => s.itemCount());
  const bottomPosition = itemCount > 0 ? "bottom-24 md:bottom-6" : "bottom-6";

  // Stages advance on an elapsed-time basis server-side; poll often enough that
  // the timeline animates rather than jumping.
  const { data } = useSWR(`/api/agent/track?orderId=${orderId}`, fetcher, {
    refreshInterval: 4000,
  });

  const trackingData = data?.data || {};
  const currentStage = trackingData.stage ?? 0;
  const isDelivered = currentStage >= 3;

  // Live Countdown Logic
  useEffect(() => {
    if (!estimatedDelivery) return;

    const interval = setInterval(() => {
      if (isDelivered) {
        setCountdown("Arrived");
        clearInterval(interval);
        return;
      }
      const now = new Date().getTime();
      const distance = estimatedDelivery.getTime() - now;

      if (distance < 0) {
        setCountdown("Any moment now!");
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setCountdown(`${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [estimatedDelivery, isDelivered]);

  // Use ETA from API if estimatedDelivery date isn't provided or fallback
  const displayTime = estimatedDelivery ? countdown : trackingData.eta || "Calculating...";

  const handleReportIssue = async () => {
    try {
      await fetch("/api/mcp/report-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorMessage: "User-reported order issue",
          correlationId: orderId,
          sessionId: getLastSessionId(),
          context: "order_tracker",
        }),
      });
    } finally {
      setIssueReported(true);
      setTimeout(() => setIssueReported(false), 3000);
    }
  };

  if (!isExpanded) {
    return (
      <div 
        onClick={() => setIsExpanded(true)}
        className={`fixed left-1/2 z-40 flex -translate-x-1/2 cursor-pointer items-center gap-3 rounded-full border border-white/10 bg-black/85 px-5 py-3 shadow-2xl backdrop-blur-xl transition-all hover:scale-105 active:scale-95 animate-fade-up ${bottomPosition}`}
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent glow-orange">
          <Bike size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">
            {isDelivered ? "Order Delivered!" : "Arriving in"}
          </span>
          {!isDelivered && (
            <span className="text-xs font-medium text-accent">{displayTime}</span>
          )}
        </div>
        <ChevronUp size={16} className="ml-2 text-white/50" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsExpanded(false)} />

      {/* Modal Content */}
      <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl border border-white/10 sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95"
           style={{
             background: "rgba(0,0,0,0.85)",
             backdropFilter: "blur(24px)",
             WebkitBackdropFilter: "blur(24px)",
           }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-black/40 px-6 py-5 backdrop-blur-md">
          <div>
            <h3 className="text-lg font-bold text-white">Tracking Order</h3>
            <p className="text-sm text-white/60">{restaurantName} • {orderId}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(false)}
              className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              title="Minimize"
            >
              <ChevronDown size={20} />
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              title="Close completely"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Status Area */}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent glow-orange-lg">
            {isDelivered ? <MapPin size={36} /> : <Bike size={36} className="animate-bounce" />}
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-white">
            {displayTime}
          </h2>
          <p className="text-sm font-medium text-white/60">
            {isDelivered ? "Delivered successfully" : "Estimated Delivery"}
          </p>
          <SwiggyAttribution variant="footer" className="mt-5 max-w-[320px]" />
        </div>

        {/* Timeline */}
        <div className="px-8 pb-8">
          <div className="relative">
            {/* Background Line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-white/10" />
            
            <div className="flex flex-col gap-6">
              {STAGES.map((stage) => {
                const isActive = currentStage === stage.id;
                const isCompleted = currentStage > stage.id;
                const Icon = stage.icon;

                return (
                  <div key={stage.id} className="relative flex items-center gap-4">
                    {/* Circle Node */}
                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                        isActive
                          ? "border-accent bg-accent/20 text-accent glow-orange"
                          : isCompleted
                          ? "border-accent bg-accent text-black"
                          : "border-white/20 bg-black text-white/20"
                      }`}
                    >
                      <Icon size={14} className={isActive ? "animate-pulse" : ""} />
                    </div>

                    {/* Label & Details */}
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-semibold transition-colors duration-500 ${
                          isActive || isCompleted ? "text-white" : "text-white/40"
                        }`}
                      >
                        {stage.label}
                      </span>
                      {isActive && stage.id === 2 && trackingData.driverName && (
                        <span className="text-xs text-accent animate-fade-in">
                          {trackingData.driverName} is on the way
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/5 bg-white/5 px-6 py-4">
          {issueReported ? (
            <div className="flex w-full items-center justify-center rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
              Issue reported to Swiggy ✓
            </div>
          ) : (
            <button
              onClick={handleReportIssue}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-medium text-white transition-colors hover:border-red-500/50 hover:text-red-400"
            >
              <AlertTriangle size={16} />
              Report Issue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
