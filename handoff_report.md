# SnapOrder Engineering Handoff Report

*Date: April 2026*
*Analysis based strictly on the current filesystem state.*

---

## 1. Project Overview
SnapOrder is a Next.js web application designed to allow users to snap a photo of food and instantly order it. 
**Current End-to-End Capability:** A user can upload an image (via drag-drop or mobile camera), which is compressed client-side and sent to a Next.js API. The API uses Google Gemini 2.5 Flash to identify the food. The server then uses a mock Service Adapter to generate a list of relevant restaurants. The user can open a sliding "Menu Drawer" for a restaurant, add procedurally-mocked items to a globally persisted cart, and view their totals. **The flow stops at the "Checkout" button, which currently has no functionality.**

---

## 2. Tech Stack
- **Framework:** Next.js 16.2.4 (App Router)
- **Language:** TypeScript
- **UI & Styling:** React 19, Tailwind CSS v4, Lucide React (Icons)
- **State Management:** Zustand 5 (with `persist` middleware)
- **APIs:** Google GenAI SDK (`@google/genai` v1.50.1)
- **Notable Libraries:** `react-dropzone`

---

## 3. File Structure
- `app/api/analyze-image/route.ts`: Core backend API. Handles file validation, Gemini API integration, and orchestrates the restaurant fetch.
- `app/_services/`: The Data Provider architecture.
  - `restaurantService.ts`: Orchestrator that reads `process.env.RESTAURANT_DATA_PROVIDER`.
  - `providers/mockProvider.ts`: Legacy hardcoded data fallback.
  - `providers/swiggyProvider.ts`: Stub for future Swiggy MCP integration.
- `app/_lib/`:
  - `cartStore.ts`: Zustand global state for the shopping cart.
  - `mockRestaurants.ts`: Procedural generation logic for mock data.
- `app/_components/`: 
  - `UploadCard.tsx`: Complex component handling drag/drop, mobile camera, client-side canvas compression, and premium multi-step loading animations.
  - `MenuDrawer.tsx`: Premium sliding drawer containing the mock menu generator and cart sync.
  - `RestaurantCards.tsx`, `CartSidebar.tsx`, `StickyCart.tsx`: UI layout components.
- `app/globals.css`: Contains extensive custom CSS tokens, glassmorphism utilities, and animation keyframes.

---

## 4. Completed Features (Confirmed via Code)

- **Landing Page:** *Excellent.* Fully styled, dark mode, high-end Apple/Swiggy aesthetic.
- **Mobile Responsiveness:** *Excellent.* CSS flex/grid heavily utilized. Specific touch-device detection implemented.
- **Camera Upload:** *Working.* Uses `capture="environment"` to force rear camera on mobile.
- **Drag/Drop Upload:** *Working.* Handled by `react-dropzone` on desktop viewports.
- **Image Compression:** *Working.* Custom Canvas-based client-side compression converts uploads to WebP natively before sending to the API.
- **Gemini Image Analysis:** *Working.* Successfully hooked up to `gemini-2.5-flash` expecting strict JSON. Handles "Not Food" fallbacks gracefully.
- **Restaurant Recommendations:** *Working (Mocked).* Procedurally generates restaurant cards based on the Gemini output.
- **Cart System:** *Working.* Zustand handles Subtotal, 5% GST, and threshold-based delivery fees. Persisted to `localStorage`.
- **Sticky Cart & Sidebar:** *Working.* UI properly triggers and syncs across components.
- **Checkout:** *NOT BUILT.* Button exists but goes nowhere.
- **Tracking:** *NOT BUILT.*
- **Chat Assistant:** *NOT BUILT.*
- **Demo Mode:** *Working.* Hardcoded images bypass the file upload to demonstrate the flow.
- **Swiggy MCP Layer:** *Architecture Built, Implementation Stubbed.* The interface and provider logic exist, but it currently just `setTimeout`s and returns fake Swiggy data.

---

## 5. User Flow
1. User lands on page and clicks Dropzone or "Take Photo".
2. Client resizes image via HTML5 Canvas to WebP.
3. Image POSTed to `/api/analyze-image`.
4. Gemini AI identifies dish.
5. API requests restaurants from `restaurantService`.
6. Frontend shows a multi-step animated glassmorphism loading card.
7. Auto-scroll to results.
8. User clicks a restaurant card.
9. Sliding `MenuDrawer` opens, populated by a deterministic hash of the restaurant name.
10. User clicks "ADD", converting the button to a `- 1 +` quantity toggle.
11. Sidebar updates. User clicks "Checkout". Flow ends.

---

## 6. API Routes
- **`POST /api/analyze-image`**: The sole API route. Receives `multipart/form-data`. Validates limits. Sends base64 to Gemini. Parses JSON response. Passes dish name to the `restaurantService`. Maps backend models to frontend UI schemas. Returns `{ success, analysis, results }`.

---

## 7. Current State Management
- **App State:** Managed by `useCartStore` (Zustand). Contains `items` array and `sidebarOpen` toggle. Uses `persist` middleware to save `items` to `snaporder-cart` in `localStorage`.
- **Component State:** Standard `useState`. `UploadCard` heavily relies on state for animation sequencing (`loadingStep`).

---

## 8. Mock vs Real Systems
- **REAL:** Image compression, Gemini AI Vision analysis, CSS Animations, Cart State/Math.
- **MOCK:** All restaurant data. All menu data (procedurally generated based on strings). Delivery times, distances, and ratings are all hardcoded or randomized.
- **PLACEHOLDER:** The `SwiggyProvider` is entirely a stub simulating latency.

---

## 9. UI / UX Quality Assessment
- **Polished:** The visual design is striking. Glows, glassmorphism (`.glass`, `.glass-strong`), backdrop blurs, and bezier-curve animations feel extremely premium. The multi-step AI loading card and the Menu Drawer are production-grade UX.
- **Rough:** The absence of a location picker breaks the real-world illusion. The application assumes the user is "Near You" but never asks for GPS.

---

## 10. Bugs / Technical Debt
1. **Missing Location Context:** The `searchRestaurants(query, location?)` service is called without a location argument in the API route.
2. **Missing Error Boundaries:** Standard Next.js `error.tsx` files are absent, meaning a render crash will white-screen the app.
3. **Repetitive Fallback Assets:** Mock menus reuse the same 3 images (`/food-pizza.png`, etc.).
4. **Iron Session:** `iron-session` is in `package.json` but completely unused in the codebase.

---

## 11. What Is NOT Built Yet
- **Checkout / Payments Engine** (Stripe/Razorpay)
- **Real Swiggy Integration** (MCP server connection)
- **Geolocation API implementation**
- **Authentication / Accounts**
- **Order Tracking UI**

---

## 12. Readiness Score
- **UI Aesthetics:** 9.5/10
- **Demo Readiness:** 9/10
- **Technical Architecture:** 8.5/10
- **Swiggy Challenge Readiness:** 7/10 *(Adapter is ready, actual fetch logic is missing)*
- **Product Completeness:** 4/10 *(No checkout)*
- **Production Readiness:** 2/10 *(Cannot process real orders)*

---

## 13. Best Next 10 Tasks (Prioritized)
1. **Implement Geolocation:** Prompt user for location on load and pass coordinates to the API.
2. **Connect Swiggy MCP:** Replace the `setTimeout` stub in `swiggyProvider.ts` with an actual MCP client/fetch call.
3. **Build Checkout UI:** Create a dedicated checkout modal/page capturing address and basic details.
4. **Integrate Payments:** Hook up Stripe or Razorpay to the checkout flow.
5. **Add Global Error Boundaries:** Implement Next.js `error.tsx` for graceful failure handling.
6. **Implement User Accounts:** Utilize the existing `iron-session` dependency for auth.
7. **Build Order Tracking Flow:** Create a mock live-tracking UI for post-checkout.
8. **Add Skeleton Loaders:** Replace the blocking loading state with streaming UI/skeletons for the restaurant cards.
9. **Expand Image Assets:** Add more diverse placeholder images for the mock generator.
10. **Write E2E Tests:** Implement Playwright to ensure the upload -> cart flow doesn't regress.
