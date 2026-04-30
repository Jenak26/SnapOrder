import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { RestaurantProvider, ProviderRestaurant } from "../types";
import { SwiggyMCPError, type CartSwitchWarning, type PlaceOrderResult, type ToolCallLog } from "../../_lib/types";
import { getLastSessionId, setLastSessionId } from "../../_lib/swiggySessionId";

export const isMockMode = () => process.env.RESTAURANT_DATA_PROVIDER !== "swiggy";
export { getLastSessionId };

// Module-level singleton
let mcpClient: Client | null = null;
let mcpTransport: StreamableHTTPClientTransport | null = null;
let mcpToken: string | null = null;

async function getSwiggyToken() {
  if (typeof window === "undefined") {
    try {
      const { getSession } = await import("@/app/_lib/session");
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
  }

  return process.env.SWIGGY_TOKEN || "";
}

function logToolCall(
  tool: string,
  durationMs: number,
  status: "ok" | "error",
  errorCode?: string,
  sessionId?: string
) {
  const ts = new Date().toISOString();
  
  if (sessionId) {
    setLastSessionId(sessionId);
  } else if (!getLastSessionId()) {
    setLastSessionId(`snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  }
  
  const log: ToolCallLog = {
    ts,
    event: "mcp_tool_call",
    tool,
    durationMs,
    status,
    errorCode,
    sessionId: sessionId || getLastSessionId()
  };
  
  console.log(JSON.stringify(log));
}

async function retry<T>(
  operation: () => Promise<T>,
  toolName: string
): Promise<T> {
  let attempt = 1;
  const maxAttempts = 4;
  const startTime = Date.now();
  const maxBudgetMs = 30000;

  while (true) {
    if (Date.now() - startTime > maxBudgetMs) {
      throw new SwiggyMCPError("Request timed out after 30s. Please try again.", "TIMEOUT", false, getLastSessionId());
    }

    try {
      return await operation();
    } catch (error: any) {
      const isSwiggyError = error instanceof SwiggyMCPError;
      const code = isSwiggyError ? error.code : (error?.status?.toString() || "UNKNOWN");
      
      const is5xx = code.startsWith("5");
      const isNetwork = !code || code === "UNKNOWN" || code === "fetch failed";
      const isJSONRPC = ["UPSTREAM_TIMEOUT", "UPSTREAM_ERROR", "INTERNAL_ERROR"].includes(code);
      const is429 = code === "429";

      const retryable = is5xx || isJSONRPC || isNetwork || is429;
      
      if (!retryable || attempt >= maxAttempts) {
        throw error;
      }

      // Domain errors never retried
      if (["CART_EXPIRED", "ITEM_UNAVAILABLE"].includes(code)) {
        throw error;
      }
      
      let delay = 500 * Math.pow(2, attempt - 1);
      
      if (is429 && error.headers && error.headers.get("Retry-After")) {
        const retryAfter = parseInt(error.headers.get("Retry-After"));
        if (!isNaN(retryAfter)) {
          delay = retryAfter * 1000;
        } else {
          delay = 30000;
        }
      } else {
        // +/- 30% jitter
        const jitter = delay * 0.3;
        delay = delay + (Math.random() * 2 * jitter - jitter);
      }

      if (Date.now() - startTime + delay > maxBudgetMs) {
        throw new SwiggyMCPError("Request timed out after 30s. Please try again.", "TIMEOUT", false, getLastSessionId());
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
}

export class SwiggyProvider implements RestaurantProvider {
  private async getClient(): Promise<Client> {
    const token = await getSwiggyToken();

    if (mcpClient && mcpToken === token) return mcpClient;

    if (mcpClient) {
      await mcpClient.close();
    }

    mcpClient = new Client({
      name: "snaporder-client",
      version: "0.1.0"
    }, {
      capabilities: {}
    });

    mcpTransport = new StreamableHTTPClientTransport(new URL("https://mcp.swiggy.com/food"), {
      requestInit: {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }
    });

    await mcpClient.connect(mcpTransport);
    mcpToken = token;
    return mcpClient;
  }

  private async reAuthenticate(): Promise<void> {
    console.log("[SwiggyProvider] Re-authenticating MCP client...");
    mcpClient = null;
    mcpTransport = null;
    mcpToken = null;
    await this.getClient();
  }

  private async executeTool(name: string, args: Record<string, unknown>, isRetryFor401 = false): Promise<any> {
    const start = Date.now();
    try {
      const client = await this.getClient();
      const response = await client.callTool({ name, arguments: args });
      
      const sessionId = (response as any).meta?.sessionId;
      
      const textContent = (response.content as any[])?.find((c: any) => c.type === "text");
      if (!textContent || !('text' in textContent)) {
          throw new SwiggyMCPError("Invalid response format from Swiggy MCP", "INVALID_FORMAT", false, getLastSessionId());
      }
      
      const parsed = JSON.parse(textContent.text);
      if (!parsed.success) {
        throw new SwiggyMCPError(parsed.error || "Unknown Swiggy Error", parsed.code || "UNKNOWN", false, getLastSessionId());
      }
      
      logToolCall(name, Date.now() - start, "ok", undefined, sessionId);
      return parsed.data;
    } catch (error: any) {
      const code = error.code || error.status?.toString() || "UNKNOWN";
      logToolCall(name, Date.now() - start, "error", code);
      
      if (!isRetryFor401 && (error?.message?.includes("401") || code === "401")) {
        await this.reAuthenticate();
        return this.executeTool(name, args, true); // retry once for 401
      }
      
      if (error instanceof SwiggyMCPError) throw error;
      throw new SwiggyMCPError(error instanceof Error ? error.message : "MCP call failed", code, false, getLastSessionId());
    }
  }

  private async callToolWithRetry(name: string, args: Record<string, unknown>): Promise<any> {
    return retry(() => this.executeTool(name, args), name);
  }

  async searchRestaurants(query: string, location: { lat: number; lng: number }): Promise<ProviderRestaurant[]> {
    const addressData = await this.callToolWithRetry("get_addresses", { lat: location.lat, lng: location.lng });
    const addressId = addressData.addressId || addressData.id;

    const searchData = await this.callToolWithRetry("search_restaurants", { query, addressId });
    
    const restaurants = searchData.restaurants || [];
    return restaurants.map((r: any) => ({
      name: r.name,
      eta: r.deliveryTime || "30 min",
      rating: r.rating || 4.0,
      deliveryFee: r.fee || 40,
      distance: r.distance || "2.0 km",
      menuPreview: r.popularDish || query,
      image: r.imageUrl || "/food-pizza.png",
      priceRange: "₹₹",
      price: r.approxPrice || 299,
    }));
  }

  async getRestaurantMenu(restaurantId: string): Promise<any> {
    return this.callToolWithRetry("get_restaurant_menu", { restaurantId });
  }

  async checkRestaurantSwitch(newRestaurantId: string): Promise<CartSwitchWarning> {
    try {
      const cart = await this.getCart();
      if (cart && cart.items && cart.items.length > 0 && cart.restaurantId !== newRestaurantId) {
        return {
          willClearCart: true,
          currentRestaurantName: cart.restaurantName,
          currentItemCount: cart.items.length,
          currentTotal: cart.subtotal
        };
      }
    } catch (e) {
      // If error fetching cart, assume empty or safe
    }
    return { willClearCart: false };
  }

  async addToCart(restaurantId: string, itemId: string, quantity: number): Promise<any> {
    return this.callToolWithRetry("update_food_cart", { restaurantId, itemId, quantity });
  }

  async getCart(): Promise<any> {
    return this.callToolWithRetry("get_food_cart", {});
  }

  async applyCoupon(code: string): Promise<any> {
    return this.callToolWithRetry("apply_food_coupon", { code });
  }

  // Preserved signature, forwards to internal idempotent logic
  async placeOrder(addressId: string): Promise<PlaceOrderResult> {
    // We don't have expected total here, pass 0 to bypass strict check or just rely on recent order.
    return this.placeOrderInternal(addressId, 0); 
  }

  async placeOrderSafe(addressId: string, onConfirm: (cart: any) => Promise<boolean>): Promise<PlaceOrderResult> {
    const cart = await this.getCart();

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new SwiggyMCPError("Your cart has expired. Please add items again.", "CART_EXPIRED", false, getLastSessionId());
    }

    const confirmed = await onConfirm(cart);
    if (!confirmed) {
      throw new SwiggyMCPError("Order cancelled by user.", "USER_CANCELLED", false, getLastSessionId());
    }

    return this.placeOrderInternal(addressId, cart.subtotal);
  }

  private async placeOrderInternal(addressId: string, expectedTotal: number): Promise<PlaceOrderResult> {
    try {
      const res = await this.executeTool("place_food_order", { addressId, paymentMethod: "COD" });
      return {
        orderId: res.orderId,
        estimatedDelivery: res.estimatedDelivery,
        status: "CONFIRMED",
        total: expectedTotal
      };
    } catch (error: any) {
      const isSwiggyError = error instanceof SwiggyMCPError;
      const code = isSwiggyError ? error.code : error?.status?.toString() || "UNKNOWN";
      const is5xx = code.startsWith("5");
      const isNetwork = !code || code === "UNKNOWN" || code === "fetch failed";
      
      if (is5xx || isNetwork) {
        // Wait 2-3 seconds
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
        
        try {
          const ordersRes = await this.executeTool("get_food_orders", {});
          const orders = ordersRes.orders || [];
          
          const recentOrder = orders.find((o: any) => {
            const timeDiff = Date.now() - new Date(o.createdAt).getTime();
            // If expectedTotal is 0 (from blind placeOrder call), we just trust the most recent order within 60s
            const totalMatches = expectedTotal > 0 ? o.total === expectedTotal : true;
            return timeDiff < 60000 && totalMatches;
          });
          
          if (recentOrder) {
            return {
              orderId: recentOrder.id,
              estimatedDelivery: recentOrder.estimatedDelivery || "35 mins",
              status: "RECOVERED",
              total: recentOrder.total
            };
          }
        } catch (checkErr) {
           // Ignore check error
        }

        // Retry place_food_order ONCE
        try {
          const retryRes = await this.executeTool("place_food_order", { addressId, paymentMethod: "COD" });
          return {
            orderId: retryRes.orderId,
            estimatedDelivery: retryRes.estimatedDelivery,
            status: "CONFIRMED",
            total: expectedTotal
          };
        } catch (finalError) {
          throw new SwiggyMCPError("We couldn't confirm your order. Check your Swiggy app before trying again.", "ORDER_FAILED_UNKNOWN", false, getLastSessionId());
        }
      }
      
      throw error;
    }
  }

  async trackOrder(orderId: string): Promise<any> {
    return this.callToolWithRetry("track_food_order", { orderId });
  }
}
