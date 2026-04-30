"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Bot } from "lucide-react";
import { useAgentChat } from "@/app/_hooks/useAgentChat";
import type { AnalyzeImageResult } from "@/app/_lib/types";
import SwiggyAttribution from "./SwiggyAttribution";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dishAnalysis?: AnalyzeImageResult;
  onOrderPlaced?: (orderId: string, eta: string) => void;
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

export default function ChatPanel({ isOpen, onClose, dishAnalysis, onOrderPlaced }: Props) {
  const { conversationHistory, activeTool, isStreaming, sendMessage } = useAgentChat(
    dishAnalysis,
    onOrderPlaced
  );
  
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory, activeTool, isStreaming]);

  // Focus input on open
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
      {/* Backdrop (mobile only, or optional on desktop) */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col shadow-2xl transition-transform duration-400 ease-out md:w-[420px] ${
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
              {conversationHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  } animate-fade-up`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "rounded-2xl rounded-br-sm bg-accent text-white shadow-lg shadow-accent/20"
                        : "glass rounded-2xl rounded-bl-sm text-white/90"
                    }`}
                  >
                    {/* Render tool calls inside agent message */}
                    {msg.role === "agent" && msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {msg.toolCalls.map((tc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-1 text-[10px] font-medium text-white/60 border border-white/5"
                          >
                            <span>⚙️</span>
                            <span>{tc.name}</span>
                            {tc.status === "running" && (
                              <Loader2 size={10} className="animate-spin text-accent" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Render text content */}
                    {msg.content && (
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </div>
                    )}
                  </div>
                  <span className="mt-1.5 px-1 text-[10px] font-medium text-white/40">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}

              {/* Active Tool Indicator */}
              {activeTool && (
                <div className="flex items-start animate-fade-up">
                  <div className="glass flex items-center gap-3 rounded-2xl rounded-bl-sm px-4 py-3 text-sm">
                    <div className="relative flex h-3 w-3 items-center justify-center">
                      <div className="absolute h-full w-full animate-ping rounded-full bg-accent opacity-75"></div>
                      <div className="relative h-1.5 w-1.5 rounded-full bg-accent"></div>
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
            >
              {isStreaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
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
