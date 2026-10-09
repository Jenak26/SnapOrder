"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Check, X, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { getLastSessionId } from "@/app/_lib/swiggySessionId";
import { DOCK } from "@/app/_hooks/useDockHeight";
import SwiggyAttribution from "./SwiggyAttribution";

interface Props {
  orderId: string;
  estimatedDelivery?: Date;
  restaurantName: string;
  onClose?: () => void;
}

const STAGES = [
  { id: 0, label: "Order placed", note: "Sent to the kitchen" },
  { id: 1, label: "Being prepared", note: "On the pass" },
  { id: 2, label: "Out for delivery", note: "On the road" },
  { id: 3, label: "Delivered", note: "At your door" },
];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OrderTracker({
  orderId,
  estimatedDelivery,
  restaurantName,
  onClose,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [countdown, setCountdown] = useState<string>("…");
  const [issueReported, setIssueReported] = useState(false);

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
        setCountdown("Any moment");
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setCountdown(`${minutes}:${String(seconds).padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [estimatedDelivery, isDelivered]);

  // Use ETA from API if estimatedDelivery date isn't provided or fallback
  const displayTime = estimatedDelivery
    ? countdown
    : trackingData.eta || "Calculating…";

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

  // ── Minimised: a docket stub ─────────────────────────────
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        /* Centred, so on a phone it would sit across the right-aligned agent
           button — it stacks above the whole dock instead. */
        style={{ bottom: `calc(${DOCK.agent} + 1.5rem)` }}
        className="animate-rise fixed left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full bg-ink py-2.5 pl-5 pr-4 text-paper shadow-[0_16px_40px_-14px_rgba(22,18,14,0.7)]"
      >
        <span className="flex items-center gap-2.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isDelivered ? "bg-cardamom" : "bg-chilli animate-blink"
            }`}
          />
          <span className="label text-[9px] text-paper/60">
            {isDelivered ? "Delivered" : "Arriving in"}
          </span>
        </span>
        {!isDelivered && (
          <span className="mono text-[15px] font-semibold tabular-nums">
            {displayTime}
          </span>
        )}
        <ChevronUp size={15} className="text-paper/50" />
      </button>
    );
  }

  // ── Expanded: a delivery docket ──────────────────────────
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-[3px]"
        onClick={() => setIsExpanded(false)}
      />

      <div className="animate-sheet-up relative w-full max-w-[420px] bg-card shadow-[0_30px_80px_-30px_rgba(22,18,14,0.75)]">
        {/* Head */}
        <header className="flex items-start justify-between px-6 pb-4 pt-6">
          <div>
            <p className="label label-chilli">Order docket</p>
            <h3 className="serif mt-1.5 text-[24px] leading-none text-ink">
              {restaurantName}
            </h3>
            <p className="mono mt-2 text-[10px] text-ink-3">{orderId}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsExpanded(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-rule text-ink transition-colors hover:border-ink hover:bg-paper-2"
              title="Minimise"
              aria-label="Minimise"
            >
              <ChevronDown size={15} />
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-rule text-ink transition-colors hover:border-danger hover:text-danger"
              title="Dismiss"
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </header>

        <div className="perf mx-6" />

        {/* The clock. One enormous number, because at this point in the flow
            it is the only thing anybody is looking at. */}
        <div className="px-6 py-7 text-center">
          <p className="label">
            {isDelivered ? "Delivered" : "Estimated arrival"}
          </p>
          <p className="numeral mt-2 text-[4.5rem] leading-none tracking-tight text-ink">
            {displayTime}
          </p>
          {!isDelivered && (
            <p className="mono mt-1 text-[10px] text-ink-3">MINUTES : SECONDS</p>
          )}
        </div>

        <div className="perf mx-6" />

        {/* Timeline */}
        <ol className="px-6 py-6">
          {STAGES.map((stage, i) => {
            const isActive = currentStage === stage.id;
            const isCompleted = currentStage > stage.id;
            const isLast = i === STAGES.length - 1;

            return (
              <li key={stage.id} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Connector */}
                {!isLast && (
                  <span className="absolute left-[9px] top-5 h-full w-px bg-rule">
                    <span
                      className={`block w-px bg-chilli transition-all duration-700 ${
                        isCompleted ? "h-full" : "h-0"
                      }`}
                    />
                  </span>
                )}

                <span
                  className={`relative z-10 mt-1 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border transition-all duration-500 ${
                    isCompleted
                      ? "border-chilli bg-chilli text-card"
                      : isActive
                      ? "border-chilli bg-card"
                      : "border-rule bg-card"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={10} strokeWidth={3.5} />
                  ) : isActive ? (
                    <span className="h-2 w-2 rounded-full bg-chilli animate-blink" />
                  ) : null}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[14px] font-medium transition-colors duration-500 ${
                      isActive || isCompleted ? "text-ink" : "text-ink-3"
                    }`}
                  >
                    {stage.label}
                  </p>
                  <p className="mono mt-0.5 text-[10px] text-ink-3">
                    {isActive && stage.id === 2 && trackingData.driverName
                      ? `${trackingData.driverName} is on the way`
                      : stage.note}
                  </p>
                </div>

                {isActive && (
                  <span className="label label-chilli mt-1 shrink-0 text-[9px]">
                    Now
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <div className="px-6 pb-5">
          <SwiggyAttribution variant="footer" />

          {issueReported ? (
            <p className="mt-2.5 border-l-2 border-cardamom bg-cardamom/8 px-4 py-3 text-[13px] font-medium text-cardamom">
              Reported to Swiggy — thank you
            </p>
          ) : (
            <button
              onClick={handleReportIssue}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full border border-rule py-3 text-[13px] font-medium text-ink-2 transition-colors hover:border-danger hover:text-danger"
            >
              <AlertTriangle size={14} />
              Something is wrong with this order
            </button>
          )}
        </div>

        <div className="zigzag" />
      </div>
    </div>
  );
}
