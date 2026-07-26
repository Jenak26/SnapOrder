# SnapOrder — Demo Coherence & Polish

*Date: 2026-07-26*

## Context

SnapOrder is applying for official Swiggy Food MCP access. The deliverable is a screen
recording, made today, that convinces a Swiggy reviewer the app uses their MCP tools
correctly and is worth granting credentials to.

Constraints that shape every decision below:

- **No Swiggy credentials.** The entire recording runs in mock mode.
- **Chat agent front and center.** The recording leads with the agentic MCP flow, not the
  manual UI path.
- **Recorded on `localhost` via `npm run dev`.** A single Node process, so module-level
  state persists across requests for the duration of the recording.
- **Hours, not days.**

The audience is a Swiggy engineer evaluating MCP usage. That makes *coherence* — does the
data the agent returns make sense, turn after turn — matter more than visual flourish.

## Problem

The demo does not currently survive being watched closely. Nine defects, all verified in
the code:

| # | Defect | Location | On-camera symptom |
| --- | --- | --- | --- |
| 1 | `search_restaurants` ignores the query | `api/agent/chat/route.ts` `callMockTool` | Upload a pizza, get offered Meghana Foods (a biryani place) |
| 2 | `search_menu` returns a fixed biryani menu | same | Agent offers Chicken Biryani for any photo |
| 3 | `update_food_cart` returns literal placeholders | same | Cart displays **"Added Item"** from **"Mocked Restaurant"** |
| 4 | `get_food_cart` returns a *different* hardcoded cart | same | Cart visibly changes when the agent checks it |
| 5 | Agent history flattened to text between turns | `route.ts:239` | "Add it to my cart" stalls — IDs from turn 1 are gone |
| 6 | No lat/lng reaches the agent | `useAgentChat.ts:44` | `get_addresses` hallucinates, or the agent stops to ask |
| 7 | Tracker takes 100+ s to reach Delivered | `OrderTracker.tsx:36` (20 s × 6 polls) | Dead air, or a cut that looks like a fake |
| 8 | Order restaurant name hardcoded | `page.tsx:36` | Tracker says "SnapOrder Delivery" |
| 9 | Auto-opener rendered in the user's bubble | `useAgentChat.ts:170` | User appears to say "I can see Biryani in your photo" |

Defects 1–4 share a root cause: `callMockTool` is a 60-line `switch` of frozen literals
with no awareness of the detected dish and no memory between calls.

## Approach

Rejected — **scripted rail**: hard-code one perfect path. Lowest camera risk, but it breaks
on any unscripted input and demonstrates the opposite of agentic tool use.

Rejected — **visual polish only**: leaves "Mocked Restaurant" and biryani-for-pizza intact,
which is precisely what this audience notices.

Chosen — **coherent mock + agent memory**. Make the mock MCP layer dish-aware and stateful
so every tool response is consistent with the photo and with the previous call, then fix the
two defects that make the conversation stall. Visual polish rides on top.

## Design

### 1. `app/_lib/mockMcp.ts` — one module, all mock tool responses

Replaces the `callMockTool` switch. Single owner of mock MCP behaviour.

**Dish-aware discovery.** Reuses `generateRecommendations(dish, cuisine)` from
`mockRestaurants.ts`, which already selects a matching catalog (burger / pizza / biryani /
dosa / pasta) and falls back to cuisine-derived names with the dish in `popular`. Reusing it
means the agent path and the manual `RestaurantCards` path tell the same story — a reviewer
who tries both sees one consistent world.

`search_menu` delegates to `generateMockMenuSections(restaurant)`, so the identified dish
appears in the menu as the `Recommended` item.

**Stable IDs.** Catalog restaurants have no `id`. Derive `slugify(name)` (e.g. `napoli-express`)
and pass it as `restaurant.id`, so `generateMockMenuSections` produces item IDs of the form
`napoli-express-popular` that round-trip correctly through `update_food_cart`.

**Stateful cart.** A module-level `Map<sessionId, MockCart>`. `update_food_cart` looks the
item up in the generated menu and appends its **real name and price**; `get_food_cart` returns
what was actually accumulated. Switching restaurants clears the cart, mirroring Swiggy's real
single-restaurant constraint — worth showing on camera. `sessionId` is generated client-side
and sent with each request.

> Module state is safe here only because the recording is local and single-process. If this
> ever runs on Vercel, the cart must be round-tripped through the client instead.

**Real coupon math.** `fetch_food_coupons` returns codes with numeric values scaled to the
cart; `apply_food_coupon` computes the discount and returns updated totals, so the applied
saving is visible rather than merely asserted in prose.

**Order placement** returns `{ orderId, estimatedDelivery, restaurantName, total }` — the
fields the tracker needs, which the current mock omits.

### 2. Agent memory across turns

The route currently rebuilds history as `{ role, parts: [{ text: m.content || " " }] }`,
discarding every `functionCall` and `functionResponse`. Fix: round-trip the raw Gemini
`Content[]`. The route returns its final `currentHistory` in the `done` event; `useAgentChat`
stores it and sends it back as `geminiHistory` on the next turn. The route prefers
`geminiHistory` when present and falls back to the text reconstruction otherwise.

This preserves tool-call context exactly and is the smallest change that makes multi-turn
ordering work.

### 3. Location wiring

`ChatPanel` reads `useGeolocation()` and passes `lat`/`lng` into `useAgentChat`, which sends
them with every request. The system prompt pins them:

> The user is at latitude {lat}, longitude {lng}. Call `get_addresses` with exactly these
> coordinates. Never ask the user for their location.

Removes the stall at the very first tool call — the worst possible place for one.

### 4. Tracker fidelity

- `order_placed` carries `restaurantName` and `total`; `page.tsx` uses the real name instead
  of the hardcoded `"SnapOrder Delivery"`.
- `/api/agent/track` switches from poll-count to **elapsed time** keyed off first sight of the
  order: Accepted → Preparing at 8 s → Out for delivery at 20 s → Delivered at 35 s.
  Time-based is robust to poll interval and restarts, unlike the current counter.
- `OrderTracker` poll interval 20 s → 5 s, so stages animate during the recording.

### 5. Opening message

Rephrase the auto-opener from the agent-voiced *"I can see Biryani in your photo. Let me find
it on Swiggy near you!"* (rendered as the **user's** message) to a natural user request:
*"Find {dish} near me and show me the best options."* The agent's reply then reads correctly.

### 6. Polish (P1)

- **Tool chips** — friendly label plus the raw MCP tool name in a mono badge, with a
  checkmark on completion. For this audience the literal `update_food_cart` string is the
  evidence, not noise. This is the single most important visual in the recording.
- **Coupon savings line** in `CartSidebar`.
- **Typewriter reveal** on agent text, so a whole-response paste reads as streaming.
- **Distance units** — catalogs say `"0.3 mi"` next to `₹` prices. Change to `km`.

### 7. Camera guardrail

`SESSION_SECRET` is unset, so `getSession()` throws and `/api/auth/session` returns 500 on
every page load. Add a `SESSION_SECRET` to `.env.local` so the endpoint returns a clean
`isConnected: false`. The "Connect Swiggy Account" button still leads to an error toast
(OAuth genuinely is not configured) — **do not click it on camera**.

## Out of scope

Deliberately excluded, and why:

- **Real checkout** (`/api/checkout`, wiring the dead `placeOrderSafe`) — invisible in a mock
  recording.
- **Routing the chat agent through `SwiggyProvider`'s retry/logging** — correct, but changes
  nothing on camera and risks destabilising the demo path hours before recording.
- **README accuracy pass** — the README claims `/api/checkout` exists and that `placeOrderSafe`
  is wired, neither of which is true. Worth fixing before a reviewer reads the repo, but it is
  not part of the recording.
- **Reconciling the dual cart systems** (Zustand vs MCP). Real architectural debt; too large
  for today.

## Success criteria

A single unbroken take in which:

1. A photo of any of pizza / burger / biryani / dosa / pasta yields restaurants that
   plausibly serve that dish.
2. The words "Mocked Restaurant" and "Added Item" never appear.
3. Adding an item, then asking a follow-up question, then ordering works without the agent
   losing track of the restaurant or item.
4. The agent never asks the user where they are.
5. A coupon visibly reduces the total.
6. The tracker names the real restaurant and reaches Delivered within ~35 s.
7. Each MCP tool name is legible on screen as it fires.

## Risks

- **Gemini free-tier 429.** A full flow is 6–8 `generateContent` calls; a rate limit
  mid-recording is plausible. Already handled with a clear message, but the mitigation is
  operational: do a dry run, then wait a minute before the real take.
- **Non-determinism.** The agent may choose a different tool order between takes. Acceptable —
  it is a genuine agent — but expect to record more than one take.
