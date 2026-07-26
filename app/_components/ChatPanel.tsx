"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Bot, Check, AlertCircle } from "lucide-react";
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

const QUICK_ACTIONS = [
  "🍗 Find Butter Chicken near me",
  "🌿 Show veg options under ₹200",
  "⚡ What's fastest to deliver?",
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
    <div className="whitespace-pre-wrap leading-relaxed">
      {text.slice(0, revealed)}
      {animate && revealed < text.length && (
        <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-accent align-middle" />
      )}
    </div>
  );
}

/**
 * Tool chip. Shows a human label *and* the literal MCP tool name — for a Swiggy
 * reviewer the raw `update_food_cart` string is the evidence, not noise.
 */
function ToolChip({ call }: { call: ToolCallEvent }) {
  const label = TOOL_DISPLAY_NAMES[call.name] || call.name;
  const isError = call.status === "error";
  const isRunning = call.status === "running";

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors ${
        isError
          ? "border-danger/30 bg-danger/10"
          : isRunning
            ? "border-accent/30 bg-accent/10"
            : "border-success/20 bg-success/5"
      }`}
      title={isError ? call.resultSummary : undefined}
    >
      <span className="shrink-0">
        {isRunning ? (
          <Loader2 size={11} className="animate-spin text-accent" />
        ) : isError ? (
          <AlertCircle size={11} className="text-danger" />
        ) : (
          <Check size={11} className="text-success" />
        )}
      </span>
      <span className="text-[11px] font-medium text-white/75">{label}</span>
      <code className="rounded bg-black/50 px-1.5 py-0.5 font-mono text-[9px] tracking-tight text-white/45">
        {call.name}
      </code>
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
  const { conversationHistory, activeTool, isStreaming, sendMessage } = useAgentChat({
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
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-[60] flex w-full flex-col shadow-2xl transition-transform duration-400 ease-out md:w-[420px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-black/40 px-5 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent glow-orange">
              <Bot size={22} />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent border-2 border-black" />
            </div>
            <div>
              <h3 className="font-semibold text-white">SnapOrder AI</h3>
              <SwiggyAttribution variant="powered-by" />
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {conversationHistory.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center animate-fade-up">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent glow-orange-lg">
                <Bot size={32} />
              </div>
              <h2 className="mb-2 text-xl font-bold text-white">How can I help?</h2>
              <p className="mb-8 max-w-[250px] text-sm text-white/60">
                I can find specific dishes, recommend restaurants, and place orders for you.
              </p>

              <div className="flex w-full flex-col gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    onClick={() => sendMessage(action)}
                    className="w-full rounded-xl border border-border bg-white/5 px-4 py-3 text-left text-sm text-white transition-colors hover:border-accent/40 hover:bg-white/10"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {conversationHistory.map((msg, i) => {
                const isLast = i === conversationHistory.length - 1;
                return (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    } animate-fade-up`}
                  >
                    {/* Tool calls sit above the reply, as a visible audit trail */}
                    {msg.role === "agent" && msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="mb-2 flex max-w-[92%] flex-col gap-1.5">
                        {msg.toolCalls.map((tc, idx) => (
                          <ToolChip key={`${tc.name}-${idx}`} call={tc} />
                        ))}
                      </div>
                    )}

                    {msg.content && (
                      <div
                        className={`max-w-[85%] px-4 py-3 text-sm ${
                          msg.role === "user"
                            ? "rounded-2xl rounded-br-sm bg-accent text-white shadow-lg shadow-accent/20"
                            : "glass rounded-2xl rounded-bl-sm text-white/90"
                        }`}
                      >
                        {msg.role === "agent" ? (
                          <TypewriterText
                            text={msg.content}
                            animate={isLast && isStreaming}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </div>
                        )}
                      </div>
                    )}

                    {msg.content && (
                      <span className="mt-1.5 px-1 text-[10px] font-medium text-white/40">
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
                <div className="flex items-start animate-fade-up">
                  <div className="glass flex items-center gap-3 rounded-2xl rounded-bl-sm px-4 py-3 text-sm">
                    <div className="relative flex h-3 w-3 items-center justify-center">
                      <div className="absolute h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                      <div className="relative h-1.5 w-1.5 rounded-full bg-accent" />
                    </div>
                    <span className="font-medium text-white/70">
                      {TOOL_DISPLAY_NAMES[activeTool] || `Running ${activeTool}...`}
                    </span>
                  </div>
                </div>
              )}

              <div ref={endOfMessagesRef} className="h-2" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-black/40 p-4 backdrop-blur-md">
          <form
            onSubmit={handleSend}
            className="relative flex items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-colors focus-within:border-accent/50 focus-within:bg-white/10"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isStreaming ? "AI is thinking..." : "Ask me anything about food..."}
              disabled={isStreaming}
              className="w-full bg-transparent px-4 py-4 text-sm text-white placeholder-white/40 outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              aria-label="Send message"
            >
              {isStreaming ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} className="ml-1" />
              )}
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] text-white/30">
            SnapOrder AI can make mistakes. Check your cart before ordering.
          </div>
        </div>
      </div>
    </>
  );
}
