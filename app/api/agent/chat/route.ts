import { NextRequest } from "next/server";
import { GoogleGenAI, Type, FunctionDeclaration, Content } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { getSession } from "@/app/_lib/session";
import { callMockTool } from "@/app/_lib/mockMcp";

const isMockMode =
  process.env.NEXT_PUBLIC_MOCK_MODE === "true" ||
  process.env.RESTAURANT_DATA_PROVIDER !== "swiggy";

async function getSwiggyToken() {
  try {
    const session = await getSession();
    if (
      session.swiggyToken &&
      (!session.tokenExpiry || session.tokenExpiry > Date.now())
    ) {
      return session.swiggyToken;
    }
  } catch {
    // Fall back to env var when OAuth session config is unavailable in dev.
  }

  return process.env.SWIGGY_TOKEN || "";
}

// ── MCP Tool Definitions for Gemini ──
const mcpTools: FunctionDeclaration[] = [
  {
    name: "get_addresses",
    description:
      "Get the user's saved delivery addresses. Must be called before searching restaurants. Returns an addressId to use in later calls.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        lat: { type: Type.NUMBER },
        lng: { type: Type.NUMBER },
      },
      required: ["lat", "lng"],
    },
  },
  {
    name: "search_restaurants",
    description:
      "Search for restaurants near the user that serve a dish or cuisine. Returns restaurants each with an `id` — you must use that exact id in search_menu and update_food_cart.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "Dish or cuisine to search for" },
        addressId: { type: Type.STRING },
      },
      required: ["query", "addressId"],
    },
  },
  {
    name: "search_menu",
    description:
      "List a restaurant's menu. Returns items each with an `id` — you must use that exact id in update_food_cart. Call this before adding anything to the cart.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        restaurantId: {
          type: Type.STRING,
          description: "The `id` returned by search_restaurants",
        },
        query: {
          type: Type.STRING,
          description: "Optional dish name to filter the menu by",
        },
      },
      required: ["restaurantId"],
    },
  },
  {
    name: "update_food_cart",
    description:
      "Add or update an item in the cart. Use ids returned by search_restaurants and search_menu. Set quantity to 0 to remove an item.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        restaurantId: { type: Type.STRING },
        itemId: { type: Type.STRING },
        quantity: { type: Type.NUMBER },
      },
      required: ["restaurantId", "itemId", "quantity"],
    },
  },
  {
    name: "get_food_cart",
    description: "Get the current cart contents and totals.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "fetch_food_coupons",
    description: "Fetch available discount coupons for the current cart.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "apply_food_coupon",
    description: "Apply a coupon code to the cart. Returns the updated totals.",
    parameters: {
      type: Type.OBJECT,
      properties: { code: { type: Type.STRING } },
      required: ["code"],
    },
  },
  {
    name: "place_food_order",
    description:
      "Place the order. Always confirm explicitly with the user before calling this.",
    parameters: {
      type: Type.OBJECT,
      properties: { addressId: { type: Type.STRING } },
      required: ["addressId"],
    },
  },
  {
    name: "track_food_order",
    description: "Track an existing order by id.",
    parameters: {
      type: Type.OBJECT,
      properties: { orderId: { type: Type.STRING } },
      required: ["orderId"],
    },
  },
];

/**
 * The free tier allows only 5 requests/minute *per model*, and one agent turn can
 * spend several. Falling back to a different model on 429 moves the next attempt
 * to a separate quota bucket, which keeps a live demo flowing instead of dying
 * mid-conversation. Mirrors the fallback already used by /api/analyze-image.
 */
const AGENT_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

function isRateLimited(error: unknown) {
  const message =
    error instanceof Error ? error.message : JSON.stringify(error ?? "");
  return (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("quota")
  );
}

async function generateWithFallback(
  ai: GoogleGenAI,
  contents: Content[],
  config: Record<string, unknown>
) {
  let lastError: unknown;

  for (const model of AGENT_MODELS) {
    try {
      return await ai.models.generateContent({ model, contents, config });
    } catch (error) {
      lastError = error;
      if (!isRateLimited(error)) throw error;
      console.warn(`[agent] ${model} rate limited, falling back`);
    }
  }

  throw lastError;
}

// ── Real MCP Logic ──
async function callRealTool(
  name: string,
  args: Record<string, unknown>,
  token: string
) {
  const client = new Client(
    { name: "snaporder-agent", version: "0.1.0" },
    { capabilities: {} }
  );
  const transport = new StreamableHTTPClientTransport(
    new URL("https://mcp.swiggy.com/food"),
    { requestInit: { headers: { Authorization: `Bearer ${token}` } } }
  );

  await client.connect(transport);
  try {
    const response = await client.callTool({ name, arguments: args });
    const textContent = (response.content as { type: string; text?: string }[])?.find(
      (c) => c.type === "text"
    );
    if (!textContent?.text) {
      return { success: false, error: "Invalid MCP response format" };
    }
    return JSON.parse(textContent.text);
  } finally {
    await client.close();
  }
}

// ── Streaming SSE API ──
export async function POST(req: NextRequest) {
  try {
    const {
      userMessage,
      conversationHistory = [],
      geminiHistory,
      dishAnalysis,
      lat,
      lng,
      sessionId = "default",
    } = await req.json();

    const swiggyToken = await getSwiggyToken();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const hasCoords = typeof lat === "number" && typeof lng === "number";

    const systemPrompt = `You are SnapOrder, a friendly AI food ordering agent powered by Swiggy.

Ordering flow:
- Call get_addresses first, before searching restaurants.${
      hasCoords
        ? `\n- The user is at latitude ${lat}, longitude ${lng}. Pass exactly these coordinates to get_addresses. Never ask the user for their location.`
        : ""
    }
- Use search_restaurants to find places, then search_menu to see what they serve.
- Always use the exact \`id\` values returned by the tools. Never invent an id, a
  restaurant name, a dish name, a price, or an ETA.
- Before checkout, call fetch_food_coupons and apply the best available coupon.
- Confirm explicitly with the user before calling place_food_order.

Style:
- Keep replies to 2-3 sentences. Be warm and concrete.
- Name the real dishes and prices returned by the tools.
- Mention that results come from Swiggy when you first show them.
${
  dishAnalysis
    ? `\nContext: the user just photographed ${dishAnalysis.dish_name} (${dishAnalysis.cuisine} cuisine). Search for that dish first.`
    : ""
}`;

    // Prefer the structured history round-tripped from the client: it preserves
    // functionCall / functionResponse parts, which a text-only reconstruction loses.
    let currentHistory: Content[] =
      Array.isArray(geminiHistory) && geminiHistory.length > 0
        ? (geminiHistory as Content[])
        : (conversationHistory as { role: string; content?: string }[]).map((m) => ({
            role: m.role === "agent" ? "model" : "user",
            parts: [{ text: m.content || " " }],
          }));

    currentHistory = [
      ...currentHistory,
      { role: "user", parts: [{ text: userMessage }] },
    ];

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;
        const sendEvent = (type: string, data: Record<string, unknown>) => {
          if (closed) return;
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
          );
        };

        try {
          let isDone = false;
          let guard = 0;

          while (!isDone && guard < 12) {
            guard++;

            const response = await generateWithFallback(ai, currentHistory, {
              systemInstruction: systemPrompt,
              tools: [{ functionDeclarations: mcpTools }],
              temperature: 0.2,
            });

            const functionCalls = response.functionCalls;
            const textResponse = response.text;

            if (textResponse) {
              sendEvent("text", { content: textResponse });
            }

            if (functionCalls && functionCalls.length > 0) {
              currentHistory.push({
                role: "model",
                parts: functionCalls.map((fc) => ({ functionCall: fc })),
              });

              const functionResponsesParts = [];

              for (const fc of functionCalls) {
                if (!fc.name) continue;
                sendEvent("tool_call", { tool: fc.name, status: "running" });

                const args = (fc.args || {}) as Record<string, unknown>;
                const result = isMockMode
                  ? await callMockTool(fc.name, args, {
                      sessionId,
                      dish: dishAnalysis?.dish_name,
                      cuisine: dishAnalysis?.cuisine,
                    })
                  : await callRealTool(fc.name, args, swiggyToken);

                sendEvent("tool_result", {
                  tool: fc.name,
                  status: result.success ? "done" : "error",
                  resultSummary: result.success
                    ? "Success"
                    : (result as { error?: string }).error || "Failed",
                });

                const data = result.success
                  ? ((result as { data: Record<string, unknown> }).data ?? {})
                  : {};

                if (
                  result.success &&
                  ["update_food_cart", "get_food_cart", "apply_food_coupon"].includes(
                    fc.name
                  ) &&
                  Array.isArray(data.items)
                ) {
                  sendEvent("cart_update", { cart: data });
                }

                if (fc.name === "place_food_order" && result.success) {
                  sendEvent("order_placed", {
                    orderId: data.orderId,
                    eta: data.estimatedDelivery || data.eta,
                    restaurantName: data.restaurantName,
                    total: data.total,
                  });
                }

                functionResponsesParts.push({
                  functionResponse: { name: fc.name, response: result },
                });
              }

              currentHistory.push({
                role: "user",
                parts: functionResponsesParts,
              });
            } else {
              isDone = true;
            }
          }

          // Hand the structured history back so the next turn keeps tool context.
          sendEvent("done", { geminiHistory: currentHistory });
          closed = true;
          controller.close();
        } catch (error: unknown) {
          console.error("Agent Error:", error);
          sendEvent("error", {
            message: error instanceof Error ? error.message : "An error occurred",
          });
          if (!closed) {
            closed = true;
            controller.close();
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Route Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
