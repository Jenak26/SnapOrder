import { useState, useCallback, useEffect, useId, useRef } from "react";
import type { ChatMessage, ToolCallEvent } from "@/app/_services/types";
import type { AnalyzeImageResult } from "@/app/_lib/types";
import { useCartStore } from "@/app/_lib/cartStore";

interface OrderPlacedPayload {
  orderId: string;
  eta: string;
  restaurantName?: string;
  total?: number;
}

interface AgentChatOptions {
  dishAnalysis?: AnalyzeImageResult;
  onOrderPlaced?: (payload: OrderPlacedPayload) => void;
  lat?: number;
  lng?: number;
}

export function useAgentChat({
  dishAnalysis,
  onOrderPlaced,
  lat,
  lng,
}: AgentChatOptions) {
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const cartSync = useCartStore((state) => state.syncFromAgent);

  const hasSentInitialMessage = useRef(false);
  /**
   * Gemini's own `Content[]`, carried between turns. The text-only view in
   * `conversationHistory` cannot represent functionCall / functionResponse parts,
   * so without this the agent forgets restaurant and item ids after one turn.
   */
  const geminiHistoryRef = useRef<unknown[]>([]);
  /**
   * Keys the server-side mock cart for this browser session. `useId` is stable
   * across renders and unique per mount, without calling impure functions
   * during render the way a Date.now/Math.random seed would.
   */
  const sessionId = `snap${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const resetChat = useCallback(() => {
    setConversationHistory([]);
    setActiveTool(null);
    setIsStreaming(false);
    hasSentInitialMessage.current = false;
    geminiHistoryRef.current = [];
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMessage: ChatMessage = {
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      setConversationHistory((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMessage: text,
            conversationHistory,
            geminiHistory: geminiHistoryRef.current,
            dishAnalysis,
            lat,
            lng,
            sessionId,
          }),
        });

        if (!res.body) throw new Error("No readable stream");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        setConversationHistory((prev) => [
          ...prev,
          { role: "agent", content: "", timestamp: new Date(), toolCalls: [] },
        ]);

        let done = false;
        let currentAgentText = "";
        let currentToolCalls: ToolCallEvent[] = [];
        // SSE frames can split across chunk boundaries; buffer until a blank line.
        let buffer = "";

        const patchLastMessage = (patch: Partial<ChatMessage>) => {
          setConversationHistory((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last) next[next.length - 1] = { ...last, ...patch };
            return next;
          });
        };

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (!value) continue;

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const line = frame.trim();
            if (!line.startsWith("data: ")) continue;

            const dataStr = line.slice(6);
            if (!dataStr) continue;

            let data: Record<string, unknown>;
            try {
              data = JSON.parse(dataStr);
            } catch {
              console.error("Failed to parse SSE JSON:", dataStr);
              continue;
            }

            if (data.type === "text") {
              currentAgentText += data.content as string;
              patchLastMessage({ content: currentAgentText });
            } else if (data.type === "tool_call") {
              setActiveTool(data.tool as string);
              currentToolCalls = [
                ...currentToolCalls,
                { name: data.tool as string, status: "running" },
              ];
              patchLastMessage({ toolCalls: currentToolCalls });
            } else if (data.type === "tool_result") {
              setActiveTool(null);
              let patched = false;
              currentToolCalls = currentToolCalls.map((tc) => {
                if (patched || tc.name !== data.tool || tc.status !== "running") {
                  return tc;
                }
                patched = true;
                return {
                  ...tc,
                  status: data.status === "error" ? "error" : "done",
                  resultSummary: data.resultSummary as string,
                };
              });
              patchLastMessage({ toolCalls: currentToolCalls });
            } else if (data.type === "cart_update") {
              cartSync(data.cart as Parameters<typeof cartSync>[0]);
            } else if (data.type === "order_placed") {
              onOrderPlaced?.({
                orderId: data.orderId as string,
                eta: data.eta as string,
                restaurantName: data.restaurantName as string | undefined,
                total: data.total as number | undefined,
              });
            } else if (data.type === "error") {
              console.error("Agent Error:", data.message);

              let displayMsg = "⚠️ An error occurred while communicating with the AI.";
              if (typeof data.message === "string") {
                if (
                  data.message.includes("429") ||
                  data.message.includes("RESOURCE_EXHAUSTED") ||
                  data.message.includes("quota")
                ) {
                  displayMsg =
                    "⚠️ Hit the Gemini free-tier rate limit. Give it about a minute, then send that again.";
                } else {
                  try {
                    const parsed = JSON.parse(data.message);
                    displayMsg = `⚠️ ${parsed.error?.message ?? data.message}`;
                  } catch {
                    displayMsg = `⚠️ ${data.message}`;
                  }
                }
              }

              currentAgentText += (currentAgentText ? "\n\n" : "") + displayMsg;
              patchLastMessage({ content: currentAgentText });
            } else if (data.type === "done") {
              if (Array.isArray(data.geminiHistory)) {
                geminiHistoryRef.current = data.geminiHistory;
              }
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        setConversationHistory((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          const notice = "⚠️ Network error connecting to the AI.";
          if (last && last.role === "agent") {
            next[next.length - 1] = {
              ...last,
              content: last.content ? `${last.content}\n\n${notice}` : notice,
            };
          } else {
            next.push({ role: "agent", content: notice, timestamp: new Date() });
          }
          return next;
        });
      } finally {
        setIsStreaming(false);
        setActiveTool(null);
      }
    },
    [conversationHistory, dishAnalysis, cartSync, onOrderPlaced, lat, lng, sessionId]
  );

  // Open the conversation on the user's behalf once a photo has been analysed.
  // Phrased as a request the user would make, since it renders in their bubble.
  useEffect(() => {
    if (dishAnalysis && !hasSentInitialMessage.current && conversationHistory.length === 0) {
      hasSentInitialMessage.current = true;
      sendMessage(`Find ${dishAnalysis.dish_name} near me and show me the best options.`);
    }
  }, [dishAnalysis, sendMessage, conversationHistory.length]);

  return {
    conversationHistory,
    activeTool,
    isStreaming,
    sendMessage,
    resetChat,
  };
}
