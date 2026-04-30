/** Primary result returned by /api/analyze-image */
export interface AnalyzeImageResult {
  dish_name: string;
  confidence: number;
  cuisine: string;
  search_query: string;
}

/** Downstream match used by DemoPreview / RestaurantCards */
export interface MatchResult {
  name: string;
  restaurant: string;
  distance: string;
  price: string;
  match: number;
  rating: number;
  deliveryTime: string;
  image: string;
}

export interface AnalyzeResponse {
  success: true;
  analysis: AnalyzeImageResult;
  results: MatchResult[];
}

export interface AnalyzeError {
  success: false;
  error: string;
}

export type AnalyzeResult = AnalyzeResponse | AnalyzeError;

// ── MCP Provider Resilience Types ─────────────────────────
export interface CartSwitchWarning {
  willClearCart: boolean;
  currentRestaurantName?: string;
  currentItemCount?: number;
  currentTotal?: number;
}

export interface PlaceOrderResult {
  orderId: string;
  estimatedDelivery: string;
  status: string;
  total?: number;
}

export class SwiggyMCPError extends Error {
  code: string;
  retryable: boolean;
  sessionId: string;

  constructor(message: string, code: string, retryable: boolean, sessionId: string) {
    super(message);
    this.name = "SwiggyMCPError";
    this.code = code;
    this.retryable = retryable;
    this.sessionId = sessionId;
  }
}

export interface ToolCallLog {
  ts: string;
  event: "mcp_tool_call";
  tool: string;
  durationMs: number;
  status: "ok" | "error";
  errorCode?: string;
  sessionId: string;
}
