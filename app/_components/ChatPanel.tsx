"use client";

import { useState, useRef, useEffect } from "react";
import { X, ArrowUp, Loader2, Check, AlertCircle } from "lucide-react";
import { useAgentChat } from "@/app/_hooks/useAgentChat";
import { useGeolocation } from "@/app/_hooks/useGeolocation";
import type { AnalyzeImageResult } from "@/app/_lib/types";
import type { ToolCallEvent } from "@/app/_services/types";
import SwiggyAttribution from "./SwiggyAttribution";

interface OrderPlacedPayload {
  orderId: string;
  eta: string;
  restaurantName?: string;
  total?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dishAnalysis?: AnalyzeImageResult;
  onOrderPlaced?: (payload: OrderPlacedPayload) => void;
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_addresses: "Getting your location",
  search_restaurants: "Searching Swiggy restaurants",
  search_menu: "Browsing menus",
  update_food_cart: "Updating your cart",
  get_food_cart: "Checking your cart",
  fetch_food_coupons: "Finding coupons",
  apply_food_coupon: "Applying discount",
  place_food_order: "Placing your order on Swiggy",
  track_food_order: "Getting order status",
};

// Emoji-prefixed suggestion chips are a strong "generated UI" tell, and the
// emoji also ends up in the message the agent receives.
const QUICK_ACTIONS = [
  "Find butter chicken near me",
  "Show veg options under ₹200",
  "What's fastest to deliver?",
];

/**
 * Reveals text progressively. Gemini returns a whole turn at once, so without
 * this the reply pops in as a block and reads as canned rather than generated.
 */
function TypewriterText({ text, animate }: { text: string; animate: boolean }) {
  const [ticks, setTicks] = useState(0);

  // The interval is the only writer, so no state is set during the effect body.
  useEffect(() => {
    if (!animate) return;
    // Several chars per tick: fast enough to feel live, slow enough to read.
    const timer = window.setInterval(() => setTicks((t) => t + 3), 16);
    return () => window.clearInterval(timer);
  }, [animate]);

  const revealed = animate ? Math.min(ticks, text.length) : text.length;

  return (
    <div className="whitespace-pre-wrap leading-[1.6]">
      {text.slice(0, revealed)}
      {animate && revealed < text.length && (
        <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-chilli animate-blink" />
      )}
    </div>
  );
}

/**
 * Tool chip. Shows a human label *and* the literal MCP tool name — for a
 * Swiggy reviewer the raw `update_food_cart` string is the evidence, not
 * noise. Rendered as a ticket line, monospaced, with a state rule down the
 * left edge.
 */
function ToolChip({ call }: { call: ToolCallEvent }) {
  const label = TOOL_DISPLAY_NAMES[call.name] || call.name;
  const isError = call.status === "error";
  const isRunning = call.status === "running";

  const rule = isError
    ? "bg-danger"
    : isRunning
    ? "bg-chilli"
    : "bg-cardamom";

  return (
    <div
      className="flex items-stretch overflow-hidden bg-paper-2/70"
      title={isError ? call.resultSummary : undefined}
    >
      <span className={`w-[3px] shrink-0 ${rule}`} />
      <span className="flex flex-1 items-center gap-2 px-2.5 py-1.5">
        <span className="shrink-0">
          {isRunning ? (
            <Loader2 size={10} className="animate-spin text-chilli" />
          ) : isError ? (
            <AlertCircle size={10} className="text-danger" />
          ) : (
            <Check size={10} strokeWidth={3} className="text-cardamom" />
          )}
        </span>
        <span className="text-[11px] font-medium text-ink-2">{label}</span>
        <code className="mono ml-auto shrink-0 text-[9px] text-ink-3">
          {call.name}
        </code>
      </span>
    </div>
  );
}

export default function ChatPanel({
  isOpen,
  onClose,
  dishAnalysis,
  onOrderPlaced,
}: Props) {
  const { lat, lng } = useGeolocation();
  const { conversationHistory, activeTool, isStreaming, sendMessage } =
    useAgentChat({
      dishAnalysis,
      onOrderPlaced,
      lat,
      lng,
    });

  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory, activeTool, isStreaming]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        className={`fixed inset-0 z-[60] bg-ink/55 backdrop-blur-[3px] transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 z-[60] flex w-full flex-col bg-card shadow-[-24px_0_60px_-30px_rgba(22,18,14,0.6)] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] md:w-[440px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Head ──────────────────────────────────────────── */}
        <header className="shrink-0 border-b border-rule px-5 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isStreaming ? "bg-chilli animate-blink" : "bg-cardamom"
                  }`}
                />
                <p className="label label-ink">
                  {isStreaming ? "Working" : "Ready"}
                </p>
              </div>
              <h3 className="serif mt-1.5 text-[24px] leading-none text-ink">
                The agent
              </h3>
              <SwiggyAttribution variant="powered-by" className="mt-2" />
            </div>
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-rule text-ink transition-colors hover:border-ink hover:bg-paper-2 sm:h-9 sm:w-9"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* ── Transcript ────────────────────────────────────── */}
        <div className="ledger flex-1 overflow-y-auto px-5 py-5">
          {conversationHistory.length === 0 ? (
            <div className="animate-rise flex h-full flex-col justify-center">
              <p className="label label-chilli">Ask for anything</p>
              <h2 className="display mt-3 text-[2.5rem] leading-[0.95]">
                What are you
                <br />
                <span className="display-em">hungry for?</span>
              </h2>
              <p className="mt-4 max-w-[30ch] text-[14px] leading-relaxed text-ink-2">
                It can search kitchens, read menus, apply coupons and place the
                order — and it shows you every call it makes.
              </p>

              <ul className="mt-8 border-t border-rule">
                {QUICK_ACTIONS.map((action) => (
                  <li key={action}>
                    <button
                      onClick={() => sendMessage(action)}
                      className="group flex w-full items-center justify-between gap-3 border-b border-rule py-3.5 text-left"
                    >
                      <span className="text-[14px] text-ink transition-colors group-hover:text-chilli">
                        {action}
                      </span>
                      <ArrowUp
                        size={14}
                        className="shrink-0 rotate-45 text-ink-3 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-chilli"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {conversationHistory.map((msg, i) => {
                const isLast = i === conversationHistory.length - 1;
                const isUser = msg.role === "user";

                return (
                  <div
                    key={i}
                    className={`animate-rise flex flex-col ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Tool calls sit above the reply, as a visible audit trail */}
                    {msg.role === "agent" &&
                      msg.toolCalls &&
                      msg.toolCalls.length > 0 && (
                        <div className="mb-2 flex w-full max-w-[94%] flex-col gap-1">
                          {msg.toolCalls.map((tc, idx) => (
                            <ToolChip key={`${tc.name}-${idx}`} call={tc} />
                          ))}
                        </div>
                      )}

                    {msg.content && (
                      <div
                        className={`max-w-[88%] px-4 py-3 text-[14px] ${
                          isUser
                            ? "rounded-[14px] rounded-br-[3px] bg-ink text-paper"
                            : "rounded-[14px] rounded-bl-[3px] border border-rule bg-card text-ink"
                        }`}
                      >
                        {msg.role === "agent" ? (
                          <TypewriterText
                            text={msg.content}
                            animate={isLast && isStreaming}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap leading-[1.6]">
                            {msg.content}
                          </div>
                        )}
                      </div>
                    )}

                    {msg.content && (
                      <span className="mono mt-1.5 px-1 text-[9px] text-ink-3">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Active Tool Indicator */}
              {activeTool && (
                <div className="animate-rise flex items-center gap-2.5 border-l-2 border-chilli bg-chilli-tint px-3 py-2">
                  <Loader2 size={11} className="animate-spin text-chilli" />
                  <span className="text-[12px] font-medium text-ink-2">
                    {TOOL_DISPLAY_NAMES[activeTool] || `Running ${activeTool}`}
                  </span>
                  <code className="mono ml-auto text-[9px] text-ink-3">
                    {activeTool}
                  </code>
                </div>
              )}

              <div ref={endOfMessagesRef} className="h-1" />
            </div>
          )}
        </div>

        {/* ── Compose ───────────────────────────────────────── */}
        <div className="shrink-0 border-t border-rule px-4 py-3.5">
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 rounded-full border border-rule bg-paper px-2 py-2 transition-colors focus-within:border-ink"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isStreaming ? "Working…" : "Ask for a dish…"}
              disabled={isStreaming}
              className="w-full bg-transparent px-3 text-[14px] text-ink outline-none placeholder:text-ink-3 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-chilli text-card transition-all hover:bg-chilli-2 disabled:bg-ink-3/40 disabled:text-card/60 sm:h-9 sm:w-9"
              aria-label="Send message"
            >
              {isStreaming ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ArrowUp size={16} strokeWidth={2.5} />
              )}
            </button>
          </form>
          <p className="label mt-2.5 text-center text-[9px]">
            The agent can be wrong — check the bill before ordering
          </p>
        </div>
      </aside>
    </>
  );
}
