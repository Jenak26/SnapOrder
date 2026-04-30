# SnapOrder

Snap a photo of any dish. Find and order it on Swiggy in seconds.

`Next.js 16` `TypeScript` `Gemini 2.5 Flash` `Swiggy Food MCP` `OAuth 2.1 PKCE` `Vercel` `SSE Streaming`

## Demo

- 🎥 Watch the demo →
- 🚀 Live app → https://snap-order-six.vercel.app/

The demo shows the complete flow from photo upload to order tracking: Gemini identifies the dish, Swiggy Food MCP finds matching restaurants, and the user adds a dish to cart. The agent can discover and apply coupons before order placement. After checkout, SnapOrder tracks the live order status in a four-stage timeline.

## How It Works

```text
Browser (Next.js on Vercel)
  ├── Image upload → POST /api/analyze-image
  │     ├── Gemini 2.5 Flash (vision) → dish identification
  │     └── Swiggy Food MCP → search_restaurants → restaurant cards
  │
  ├── Chat panel → POST /api/agent/chat (SSE stream)
  │     └── Gemini 2.5 Flash (tool-use agent loop)
  │           ├── get_addresses
  │           ├── search_restaurants / search_menu
  │           ├── update_food_cart → get_food_cart
  │           ├── fetch_food_coupons → apply_food_coupon
  │           ├── place_food_order (idempotency guarded)
  │           └── track_food_order
  │
  ├── Checkout → POST /api/checkout
  │     └── placeOrderSafe() → get_food_cart → place_food_order
  │
  └── OAuth → GET /api/auth/login → /api/auth/callback
        └── Swiggy OAuth 2.1 PKCE → iron-session token storage
```

## Features

- ✅ Vision-based dish identification (Gemini 2.5 Flash)
- ✅ Geolocation-aware restaurant search via Swiggy Food MCP
- ✅ Real menu browsing (search_menu MCP tool)
- ✅ Cart management with GST + delivery fee calculation
- ✅ Coupon discovery and application (fetch_food_coupons + apply_food_coupon)
- ✅ Order placement with idempotency guards (check-then-retry pattern)
- ✅ Live order tracking with animated 4-stage timeline (SWR polling)
- ✅ Conversational AI agent with SSE streaming tool-call visibility
- ✅ Restaurant switch detection with cart safety warning
- ✅ Swiggy OAuth 2.1 PKCE authentication
- ✅ Exponential backoff + 30s retry budget on all MCP calls
- ✅ Session ID observability logging on every tool call
- ✅ Error reporting via report_error MCP tool
- ✅ Swiggy brand attribution (compliant with Builders Club guidelines)
- ✅ Data privacy notice + /privacy page
- ✅ Global error boundary with correlation IDs
- ✅ Mobile camera + drag/drop upload with client-side WebP compression
- ✅ Demo mode (5 food scenarios, bypasses API for presentations)
- 🚧 Address manager UI
- 📋 Payment gateway (Stripe/Razorpay)
- 📋 Order history + reorder
- 📋 Push notifications

## Swiggy MCP Tools Used

| Tool | Stage | What SnapOrder Uses It For |
| --- | --- | --- |
| get_addresses | Auth & Search | Fetch user's saved delivery addresses before every restaurant search |
| search_restaurants | Discovery | Find restaurants near user's location matching detected cuisine |
| search_menu | Discovery | Search for the identified dish across restaurant menus |
| update_food_cart | Cart | Add items selected from MenuDrawer or via chat agent |
| get_food_cart | Cart & Checkout | Verify cart state before order placement (mandatory refresh pattern) |
| fetch_food_coupons | Cart | Retrieve available discount codes for the current restaurant |
| apply_food_coupon | Cart | Apply selected coupon and update displayed total |
| place_food_order | Checkout | Place the confirmed order with idempotency guard |
| track_food_order | Post-order | Poll order status for the 4-stage tracking timeline |
| report_error | Reliability | Log user-reported issues from OrderTracker and error boundary |

## Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | Next.js 16 (App Router) | File-based routing, API routes, SSE streaming |
| Language | TypeScript (strict) | End-to-end type safety |
| Styling | Tailwind CSS v4 | Dark glassmorphism theme, mobile-first |
| AI — Vision | Gemini 2.5 Flash | Dish identification from user photo |
| AI — Agent | Gemini 2.5 Flash (tool-use) | Orchestrates MCP tool calls in agentic loop |
| MCP Client | @modelcontextprotocol/sdk | StreamableHTTPClientTransport to Swiggy |
| State | Zustand + persist | Cart, order, and session state with localStorage |
| Polling | SWR | Background order tracking with 20s revalidation interval |
| Auth | OAuth 2.1 PKCE + iron-session | Swiggy token acquisition and secure storage |
| Hosting | Vercel | Serverless deployment, auto HTTPS, preview URLs |

## Setup

### Prerequisites

- Node.js 18+
- Gemini API key (free at aistudio.google.com)
- Swiggy MCP credentials (apply at mcp.swiggy.com/builders)

### Quick Start

```bash
git clone https://github.com/jenak26/SnapOrder && cd snaporder
npm install
cp .env.example .env.local
```

Fill in your `GEMINI_API_KEY` in `.env.local`, then:

```bash
npm run dev
```

### Environment Variables

| Variable | Description | Required |
| --- | --- | --- |
| GEMINI_API_KEY | Google AI Studio key | Yes |
| SWIGGY_CLIENT_ID | From Swiggy Builders Club | Yes (live mode) |
| SWIGGY_CLIENT_SECRET | From Swiggy Builders Club | Yes (live mode) |
| SWIGGY_REDIRECT_URI | OAuth callback URL | Yes (live mode) |
| SESSION_SECRET | 32+ char random string | Yes |
| NEXT_PUBLIC_MOCK_MODE | "true" for demo mode | Optional |

### Mock Mode

`NEXT_PUBLIC_MOCK_MODE=true` runs the full SnapOrder UX with realistic mock data, with no Swiggy credentials required. All 10 MCP tools have mock handlers that mirror real response shapes. This is ideal for development, demos, and review environments where live credentials are not available.

## Architecture Decisions

- Gemini 2.5 Flash was selected because it supports native multimodal vision and tool-use in one model. Its 1M token context can hold the full conversation and cart state, and the free tier is sufficient for demo scale.

- SSE was chosen over WebSockets because it works on Vercel serverless without additional infrastructure. It also keeps client-side consumption simple with `ReadableStream`, and per-request stateless execution fits the agentic loop pattern.

- MCP was chosen over direct REST because it aligns with Swiggy's agent-native design intent. Tool declarations are reusable across both the chat agent and direct API routes, and the architecture remains future-proof as Swiggy adds more MCP servers.

- Zustand was chosen over Context or Redux because it has near-zero boilerplate. Its built-in localStorage persist middleware handles cart and order recovery across page refreshes, while `syncFromAgent()` keeps the UI cart aligned with MCP cart state.

## Compliance

- Data handling: user photos are processed server-side by Gemini and never stored. Location coordinates are session-only and never persisted server-side.
- Attribution: Swiggy branding is visible in restaurant cards, cart, chat panel, and order tracker per Builders Club guidelines.
- Privacy: full data handling declaration at `/privacy`. Governed by Swiggy's platform terms for transaction data.

## Built By

Janak Kabra · 2nd year CS @ VIT Vellore · Targeting MS CS/AI at top global programs (Fall 2027)

GitHub: [link] | LinkedIn: [link] | Email: [email]

---

Built for Swiggy Builders Club · April 2026
