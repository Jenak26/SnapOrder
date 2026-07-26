/**
 * Mock Swiggy Food MCP.
 *
 * Single owner of every mock tool response used by the chat agent. Two properties
 * matter more than realism of any individual field:
 *
 *  1. **Dish awareness** — responses derive from the dish the user photographed, by
 *     reusing `generateRecommendations`, the same generator behind the manual
 *     `RestaurantCards` path. Both paths therefore describe one consistent world.
 *  2. **Statefulness** — the cart accumulates across tool calls, so `get_food_cart`
 *     returns what `update_food_cart` actually put there.
 *
 * The cart lives in module memory, which is safe only because the demo is recorded
 * against `next dev` (a single process). On serverless this must move to a
 * client-round-tripped payload.
 */

import {
  generateRecommendations,
  type Restaurant,
} from "@/app/_lib/mockRestaurants";
import { generateMockMenuSections } from "@/app/_lib/menu";
import type { MenuItem } from "@/app/_services/types";

// ── Shapes ───────────────────────────────────────────────

export interface MockCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface MockCart {
  restaurantId: string;
  restaurantName: string;
  items: MockCartItem[];
  subtotal: number;
  discount: number;
  appliedCoupon: string | null;
}

interface MockSession {
  cart: MockCart | null;
  /** Restaurants surfaced by the last search, so later tools can resolve IDs. */
  restaurants: Restaurant[];
  dish: string;
  cuisine: string;
  orderPlacedAt: number | null;
  orderId: string | null;
}

type ToolResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: string };

// ── Session state ────────────────────────────────────────

const sessions = new Map<string, MockSession>();

function getSession(sessionId: string): MockSession {
  let session = sessions.get(sessionId);
  if (!session) {
    session = {
      cart: null,
      restaurants: [],
      dish: "",
      cuisine: "",
      orderPlacedAt: null,
      orderId: null,
    };
    sessions.set(sessionId, session);
  }
  return session;
}

/** Read-only accessor used by the tracking route. */
export function peekSession(sessionId: string): MockSession | undefined {
  return sessions.get(sessionId);
}

// ── Helpers ──────────────────────────────────────────────

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Catalog restaurants have no `id`; derive a stable one so item IDs round-trip. */
function withId(restaurant: Restaurant): Restaurant {
  return { ...restaurant, id: restaurant.id || slugify(restaurant.name) };
}

function findRestaurant(session: MockSession, restaurantId: string) {
  if (!restaurantId) return undefined;
  const wanted = slugify(restaurantId);
  return session.restaurants.find(
    (r) => r.id === restaurantId || slugify(r.name) === wanted || r.name === restaurantId
  );
}

function menuFor(restaurant: Restaurant): MenuItem[] {
  return generateMockMenuSections(restaurant).flatMap((section) => section.items);
}

function recalc(cart: MockCart) {
  cart.subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  if (cart.discount > cart.subtotal) cart.discount = cart.subtotal;
  return cart;
}

const ok = (data: Record<string, unknown>): ToolResult => ({ success: true, data });
const fail = (error: string): ToolResult => ({ success: false, error });

/** Mirrors real MCP latency so tool chips are legible on camera. */
const LATENCY_MS: Record<string, number> = {
  get_addresses: 350,
  search_restaurants: 900,
  search_menu: 700,
  update_food_cart: 500,
  get_food_cart: 300,
  fetch_food_coupons: 600,
  apply_food_coupon: 450,
  place_food_order: 1100,
  track_food_order: 400,
};

// ── Tool implementations ─────────────────────────────────

function getAddresses(): ToolResult {
  return ok({
    addressId: "ADDR_HOME_01",
    addresses: [
      {
        id: "ADDR_HOME_01",
        label: "Home",
        line: "flat 402, Brigade Residency, Koramangala",
        city: "Bengaluru",
        isDefault: true,
      },
    ],
  });
}

function searchRestaurants(
  session: MockSession,
  args: { query?: string; cuisine?: string }
): ToolResult {
  const query = String(args.query || session.dish || "food").trim();
  const cuisine = String(args.cuisine || session.cuisine || query);

  const restaurants = generateRecommendations(query, cuisine).map(withId);
  session.restaurants = restaurants;

  return ok({
    query,
    restaurants: restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      rating: r.rating,
      reviews: r.reviews,
      deliveryTime: r.deliveryTime,
      distance: r.distance,
      priceRange: r.priceRange,
      popularDish: r.popular,
      badge: r.badge,
    })),
  });
}

function searchMenu(
  session: MockSession,
  args: { restaurantId?: string; query?: string }
): ToolResult {
  const restaurant = findRestaurant(session, String(args.restaurantId || ""));
  if (!restaurant) {
    return fail(
      "Unknown restaurantId. Call search_restaurants first and use an id from its results."
    );
  }

  const items = menuFor(restaurant);
  const query = String(args.query || "").toLowerCase();
  const matched = query
    ? items.filter((i) => i.name.toLowerCase().includes(query))
    : items;

  return ok({
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    items: (matched.length > 0 ? matched : items).map((i) => ({
      id: i.itemId,
      name: i.name,
      description: i.description,
      price: i.price,
      isVeg: i.isVeg,
      rating: i.rating,
    })),
  });
}

function updateFoodCart(
  session: MockSession,
  args: { restaurantId?: string; itemId?: string; quantity?: number }
): ToolResult {
  const restaurant = findRestaurant(session, String(args.restaurantId || ""));
  if (!restaurant) {
    return fail(
      "Unknown restaurantId. Call search_restaurants first and use an id from its results."
    );
  }

  const items = menuFor(restaurant);
  const itemId = String(args.itemId || "");
  const item =
    items.find((i) => i.itemId === itemId) ||
    items.find((i) => i.name.toLowerCase() === itemId.toLowerCase());

  if (!item) {
    return fail(
      `Unknown itemId "${itemId}". Call search_menu for this restaurant and use an id from its results.`
    );
  }

  // Swiggy carts hold one restaurant at a time; switching starts a fresh cart.
  if (session.cart && session.cart.restaurantId !== restaurant.id) {
    session.cart = null;
  }

  if (!session.cart) {
    session.cart = {
      restaurantId: restaurant.id!,
      restaurantName: restaurant.name,
      items: [],
      subtotal: 0,
      discount: 0,
      appliedCoupon: null,
    };
  }

  const cart = session.cart;
  const quantity = Number(args.quantity ?? 1);
  const existing = cart.items.find((i) => i.id === item.itemId);

  if (existing) {
    existing.quantity = quantity;
    if (existing.quantity <= 0) {
      cart.items = cart.items.filter((i) => i.id !== item.itemId);
    }
  } else if (quantity > 0) {
    cart.items.push({
      id: item.itemId,
      name: item.name,
      price: item.price,
      quantity,
    });
  }

  return ok({ ...recalc(cart) });
}

function getFoodCart(session: MockSession): ToolResult {
  if (!session.cart || session.cart.items.length === 0) {
    return ok({
      restaurantId: "",
      restaurantName: "",
      items: [],
      subtotal: 0,
      discount: 0,
      appliedCoupon: null,
    });
  }
  return ok({ ...recalc(session.cart) });
}

function fetchFoodCoupons(session: MockSession): ToolResult {
  const subtotal = session.cart?.subtotal ?? 0;

  return ok({
    coupons: [
      {
        code: "SNAP50",
        description: "50% off up to ₹100",
        discount: Math.min(100, Math.round(subtotal * 0.5)),
      },
      {
        code: "WELCOME75",
        description: "Flat ₹75 off on orders above ₹299",
        discount: subtotal >= 299 ? 75 : 0,
      },
      {
        code: "FREEDEL",
        description: "Free delivery on this order",
        discount: 40,
      },
    ],
  });
}

function applyFoodCoupon(session: MockSession, args: { code?: string }): ToolResult {
  const cart = session.cart;
  if (!cart || cart.items.length === 0) {
    return fail("Cart is empty. Add an item before applying a coupon.");
  }

  const code = String(args.code || "").toUpperCase();
  const available = (fetchFoodCoupons(session) as { data: Record<string, unknown> })
    .data.coupons as { code: string; description: string; discount: number }[];

  const coupon = available.find((c) => c.code === code);
  if (!coupon) {
    return fail(`Coupon "${code}" is not valid for this cart.`);
  }
  if (coupon.discount <= 0) {
    return fail(`Coupon "${code}" does not apply to this cart total.`);
  }

  cart.appliedCoupon = coupon.code;
  cart.discount = coupon.discount;

  return ok({
    ...recalc(cart),
    message: `${coupon.code} applied — you saved ₹${coupon.discount}.`,
  });
}

function placeFoodOrder(session: MockSession): ToolResult {
  const cart = session.cart;
  if (!cart || cart.items.length === 0) {
    return fail("Cart is empty. Add an item before placing the order.");
  }

  const orderId = `SNP${Date.now().toString().slice(-8)}`;
  session.orderId = orderId;
  session.orderPlacedAt = Date.now();

  const total = Math.max(0, cart.subtotal - cart.discount);
  const placed = {
    orderId,
    estimatedDelivery: "32 mins",
    eta: "32 mins",
    status: "CONFIRMED",
    restaurantName: cart.restaurantName,
    total,
    savings: cart.discount,
    items: cart.items.map((i) => ({ name: i.name, quantity: i.quantity })),
  };

  // Order placed: the cart is consumed, exactly as on Swiggy.
  session.cart = null;

  return ok(placed);
}

function trackFoodOrder(session: MockSession, args: { orderId?: string }): ToolResult {
  const orderId = String(args.orderId || session.orderId || "");
  const placedAt = session.orderPlacedAt ?? Date.now();
  return ok({ orderId, ...stageFor(Date.now() - placedAt) });
}

/**
 * Elapsed-time tracking stages. Time-based rather than poll-count based so the
 * timeline is unaffected by poll interval, refetch, or a page reload mid-take.
 */
export function stageFor(elapsedMs: number) {
  const seconds = elapsedMs / 1000;

  if (seconds < 8) {
    return { status: "ACCEPTED", stage: 0, driverName: null, eta: "32 mins" };
  }
  if (seconds < 20) {
    return { status: "PREPARING", stage: 1, driverName: null, eta: "24 mins" };
  }
  if (seconds < 35) {
    return {
      status: "OUT_FOR_DELIVERY",
      stage: 2,
      driverName: "Ramesh Kumar",
      eta: "9 mins",
    };
  }
  return {
    status: "DELIVERED",
    stage: 3,
    driverName: "Ramesh Kumar",
    eta: "Arrived",
  };
}

// ── Dispatch ─────────────────────────────────────────────

export interface MockToolContext {
  sessionId: string;
  dish?: string;
  cuisine?: string;
}

export async function callMockTool(
  name: string,
  args: Record<string, unknown>,
  context: MockToolContext
): Promise<ToolResult> {
  const session = getSession(context.sessionId);
  if (context.dish) session.dish = context.dish;
  if (context.cuisine) session.cuisine = context.cuisine;

  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS[name] ?? 400));

  switch (name) {
    case "get_addresses":
      return getAddresses();
    case "search_restaurants":
      return searchRestaurants(session, args);
    case "search_menu":
      return searchMenu(session, args);
    case "update_food_cart":
      return updateFoodCart(session, args);
    case "get_food_cart":
      return getFoodCart(session);
    case "fetch_food_coupons":
      return fetchFoodCoupons(session);
    case "apply_food_coupon":
      return applyFoodCoupon(session, args);
    case "place_food_order":
      return placeFoodOrder(session);
    case "track_food_order":
      return trackFoodOrder(session, args);
    default:
      return fail(`Unknown tool "${name}".`);
  }
}
