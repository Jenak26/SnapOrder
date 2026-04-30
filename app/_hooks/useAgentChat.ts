import { useState, useCallback, useEffect, useRef } from "react";
import type { ChatMessage, ToolCallEvent } from "@/app/_services/types";
import type { AnalyzeImageResult } from "@/app/_lib/types";
import { useCartStore } from "@/app/_lib/cartStore";

export function useAgentChat(
  dishAnalysis?: AnalyzeImageResult,
  onOrderPlaced?: (orderId: string, eta: string) => void
) {
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const cartSync = useCartStore((state) => state.syncFromAgent);

  const hasSentInitialMessage = useRef(false);

  const resetChat = useCallback(() => {
    setConversationHistory([]);
    setActiveTool(null);
    setIsStreaming(false);
    hasSentInitialMessage.current = false;
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
            conversationHistory: conversationHistory,
            dishAnalysis,
          }),
        });

        if (!res.body) throw new Error("No readable stream");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        // Create an empty agent message to append to
        setConversationHistory((prev) => [
          ...prev,
          { role: "agent", content: "", timestamp: new Date(), toolCalls: [] },
        ]);

        let done = false;
        let currentAgentText = "";
        let currentToolCalls: ToolCallEvent[] = [];

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n\n");
            
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataStr = line.replace("data: ", "");
                if (!dataStr) continue;
                
                try {
                  const data = JSON.parse(dataStr);
                  
                  if (data.type === "text") {
                    currentAgentText += data.content;
                    setConversationHistory((prev) => {
                      const newHistory = [...prev];
                      newHistory[newHistory.length - 1].content = currentAgentText;
                      return newHistory;
                    });
                  } else if (data.type === "tool_call") {
                    setActiveTool(data.tool);
                    currentToolCalls = [...currentToolCalls, { name: data.tool, status: "running" }];
                    setConversationHistory((prev) => {
                      const newHistory = [...prev];
                      newHistory[newHistory.length - 1].toolCalls = currentToolCalls;
                      return newHistory;
                    });
                  } else if (data.type === "tool_result") {
                    setActiveTool(null);
                    currentToolCalls = currentToolCalls.map(tc => 
                      tc.name === data.tool ? { ...tc, status: "done", resultSummary: data.resultSummary } : tc
                    );
                    setConversationHistory((prev) => {
                      const newHistory = [...prev];
                      newHistory[newHistory.length - 1].toolCalls = currentToolCalls;
                      return newHistory;
                    });
                  } else if (data.type === "cart_update") {
                    cartSync(data.cart);
                  } else if (data.type === "order_placed") {
                    onOrderPlaced?.(data.orderId, data.eta);
                  } else if (data.type === "error") {
                    console.error("Agent Error:", data.message);
                    
                    let displayMsg = "⚠️ An error occurred while communicating with the AI.";
                    if (typeof data.message === "string") {
                      if (data.message.includes("429") || data.message.includes("RESOURCE_EXHAUSTED") || data.message.includes("quota")) {
                        displayMsg = "⚠️ Gemini API rate limit exceeded (Free Tier). Please try again in a minute.";
                      } else {
                        try {
                          const parsed = JSON.parse(data.message);
                          if (parsed.error?.message) {
                            displayMsg = `⚠️ ${parsed.error.message}`;
                          } else {
                            displayMsg = `⚠️ ${data.message}`;
                          }
                        } catch {
                          displayMsg = `⚠️ ${data.message}`;
                        }
                      }
                    }

                    currentAgentText += (currentAgentText ? "\n\n" : "") + displayMsg;
                    setConversationHistory((prev) => {
                      const newHistory = [...prev];
                      newHistory[newHistory.length - 1].content = currentAgentText;
                      return newHistory;
                    });
                  } else if (data.type === "done") {
                    // Do nothing, while loop will end
                  }
                } catch (e) {
                  console.error("Failed to parse SSE JSON:", dataStr);
                }
              }
            }
          }
        }
      } catch (error: any) {
        console.error("Chat error:", error);
        setConversationHistory((prev) => {
          const newHistory = [...prev];
          const lastMsg = newHistory[newHistory.length - 1];
          if (lastMsg && lastMsg.role === "agent") {
            lastMsg.content += (lastMsg.content ? "\n\n" : "") + "⚠️ Network error connecting to the AI.";
          } else {
            newHistory.push({
              role: "agent",
              content: "⚠️ Network error connecting to the AI.",
              timestamp: new Date(),
            });
          }
          return newHistory;
        });
      } finally {
        setIsStreaming(false);
        setActiveTool(null);
      }
    },
    [conversationHistory, dishAnalysis, cartSync, onOrderPlaced]
  );

  // Auto-send initial message if dish analysis is present
  useEffect(() => {
    if (dishAnalysis && !hasSentInitialMessage.current && conversationHistory.length === 0) {
      hasSentInitialMessage.current = true;
      sendMessage(`I can see ${dishAnalysis.dish_name} in your photo. Let me find it on Swiggy near you!`);
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
