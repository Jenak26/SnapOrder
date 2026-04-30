import { NextRequest } from "next/server";
import { GoogleGenAI, Type, FunctionDeclaration, Content, Part } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { getSession } from "@/app/_lib/session";

const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true' || process.env.RESTAURANT_DATA_PROVIDER !== 'swiggy';

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
    description: "Get the user's location address ID. Must be called before searching restaurants.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        lat: { type: Type.NUMBER },
        lng: { type: Type.NUMBER }
      },
      required: ["lat", "lng"]
    }
  },
  {
    name: "search_restaurants",
    description: "Search for restaurants by query.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING },
        addressId: { type: Type.STRING }
      },
      required: ["query", "addressId"]
    }
  },
  {
    name: "search_menu",
    description: "Search a specific restaurant's menu for items.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        restaurantId: { type: Type.STRING }
      },
      required: ["restaurantId"]
    }
  },
  {
    name: "update_food_cart",
    description: "Add or update an item in the cart.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        restaurantId: { type: Type.STRING },
        itemId: { type: Type.STRING },
        quantity: { type: Type.NUMBER }
      },
      required: ["restaurantId", "itemId", "quantity"]
    }
  },
  {
    name: "get_food_cart",
    description: "Get the current cart contents.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    }
  },
  {
    name: "fetch_food_coupons",
    description: "Fetch available discount coupons for the current cart.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    }
  },
  {
    name: "apply_food_coupon",
    description: "Apply a specific coupon code to the cart.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        code: { type: Type.STRING }
      },
      required: ["code"]
    }
  },
  {
    name: "place_food_order",
    description: "Place the order. Always confirm with the user before calling.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        addressId: { type: Type.STRING }
      },
      required: ["addressId"]
    }
  },
  {
    name: "track_food_order",
    description: "Track an existing order.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        orderId: { type: Type.STRING }
      },
      required: ["orderId"]
    }
  }
];

// ── Mock Logic ──
async function callMockTool(name: string, args: any): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network latency

  switch (name) {
    case "get_addresses":
      return { success: true, data: { addressId: "ADDR_MOCK_99" } };
    case "search_restaurants":
      return {
        success: true,
        data: {
          restaurants: [
            { id: "R1", name: "Truffles", rating: 4.5, deliveryTime: "25 mins", approxPrice: 350 },
            { id: "R2", name: "Meghana Foods", rating: 4.8, deliveryTime: "18 mins", approxPrice: 400 },
            { id: "R3", name: "Empire Restaurant", rating: 4.1, deliveryTime: "40 mins", approxPrice: 200 }
          ]
        }
      };
    case "search_menu":
      return {
        success: true,
        data: {
          items: [
            { id: "I1", name: "Chicken Biryani", price: 320, isVeg: false },
            { id: "I2", name: "Paneer Butter Masala", price: 250, isVeg: true },
            { id: "I3", name: "Garlic Naan", price: 60, isVeg: true }
          ]
        }
      };
    case "update_food_cart":
      return {
        success: true,
        data: {
          restaurantId: args.restaurantId,
          restaurantName: "Mocked Restaurant",
          items: [
            { id: args.itemId, name: "Added Item", price: 250, quantity: args.quantity }
          ],
          subtotal: 250 * args.quantity
        }
      };
    case "get_food_cart":
      return {
        success: true,
        data: {
          restaurantId: "R1",
          restaurantName: "Mocked Restaurant",
          items: [{ id: "I2", name: "Paneer Butter Masala", price: 250, quantity: 1 }],
          subtotal: 250
        }
      };
    case "fetch_food_coupons":
      return {
        success: true,
        data: { coupons: [{ code: "SWIGGY50", discount: "50% off" }, { code: "WELCOME", discount: "Flat ₹100 off" }] }
      };
    case "apply_food_coupon":
      return { success: true, data: { message: `Coupon ${args.code} applied successfully!` } };
    case "place_food_order":
      return { success: true, data: { orderId: "ORD_MOCK_" + Date.now(), eta: "35 mins" } };
    case "track_food_order":
      return { success: true, data: { status: "Food is being prepared", eta: "20 mins left" } };
    default:
      return { success: false, error: "Unknown mock tool" };
  }
}

// ── Real MCP Logic ──
async function callRealTool(name: string, args: any, token: string): Promise<any> {
  const client = new Client({ name: "snaporder-agent", version: "0.1.0" }, { capabilities: {} });
  const transport = new StreamableHTTPClientTransport(new URL("https://mcp.swiggy.com/food"), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } }
  });
  
  await client.connect(transport);
  try {
    const response = await client.callTool({ name, arguments: args });
    const textContent = (response.content as any[])?.find((c: any) => c.type === "text");
    if (!textContent || !('text' in textContent)) {
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
    const { userMessage, conversationHistory, dishAnalysis, addressId } = await req.json();

    const swiggyToken = await getSwiggyToken();

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemPrompt = `You are SnapOrder, a friendly AI food ordering agent powered by Swiggy.
Help users find and order food. Rules:
- Always call get_addresses first before searching restaurants
- Use search_menu for specific dishes, search_restaurants for browsing
- Always fetch and try to apply coupons before suggesting checkout
- Confirm explicitly before calling place_food_order
- Keep responses concise (2-3 sentences max per turn)
- Always mention you are powered by Swiggy when showing results
- Never fabricate restaurant names, prices, or ETAs
${dishAnalysis ? `Context: User just uploaded a photo of ${dishAnalysis.dish_name} (${dishAnalysis.cuisine} cuisine).` : ''}`;

    // Convert history to Gemini format
    const geminiHistory: Content[] = conversationHistory.map((m: any) => {
      // If message has toolCalls, we'd ideally reconstruct them.
      // For simplicity in this implementation, we just pass text if present.
      // In a full implementation we'd reconstruct the parts array with functionCalls and functionResponses.
      return {
        role: m.role === 'agent' ? 'model' : 'user',
        parts: [{ text: m.content || " " }]
      };
    });

    geminiHistory.push({ role: 'user', parts: [{ text: userMessage }] });

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: any) => {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
        };

        try {
          let currentHistory = [...geminiHistory];
          let isDone = false;

          while (!isDone) {
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: currentHistory,
              config: {
                systemInstruction: systemPrompt,
                tools: [{ functionDeclarations: mcpTools }],
                temperature: 0.2,
              }
            });

            // The SDK handles tool calls via functionCalls
            const functionCalls = response.functionCalls;
            const textResponse = response.text;

            if (textResponse) {
              sendEvent("text", { content: textResponse });
            }

            if (functionCalls && functionCalls.length > 0) {
              // Add model's call to history
              currentHistory.push({
                role: 'model',
                parts: functionCalls.map(fc => ({ functionCall: fc }))
              });

              const functionResponsesParts = [];

              for (const fc of functionCalls) {
                if (!fc.name) continue;
                sendEvent("tool_call", { tool: fc.name, status: "running" });
                
                // Execute tool
                const args = fc.args || {};
                let result;
                if (isMockMode) {
                  result = await callMockTool(fc.name, args);
                } else {
                  result = await callRealTool(fc.name, args, swiggyToken);
                }

                sendEvent("tool_result", { tool: fc.name, resultSummary: result.success ? "Success" : "Failed" });

                if (fc.name === "update_food_cart" || fc.name === "get_food_cart") {
                  if (result.success && result.data.items) {
                    sendEvent("cart_update", { cart: result.data });
                  }
                }
                
                if (fc.name === "place_food_order" && result.success) {
                  sendEvent("order_placed", { orderId: result.data.orderId, eta: result.data.eta });
                }

                functionResponsesParts.push({
                  functionResponse: {
                    name: fc.name,
                    response: result
                  }
                });
              }

              // Add tool responses to history
              currentHistory.push({
                role: 'user', // In Gemini, function responses are sent as 'user' role
                parts: functionResponsesParts
              });
              
              // Loop continues to let Gemini process the tool response
            } else {
              isDone = true;
            }
          }
          
          sendEvent("done", {});
          controller.close();
        } catch (error: any) {
          console.error("Agent Error:", error);
          sendEvent("error", { message: error.message || "An error occurred" });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (error) {
    console.error("Route Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
