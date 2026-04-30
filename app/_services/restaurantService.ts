import type { RestaurantProvider, ProviderRestaurant } from "./types";
import type { MenuItem, MenuSection } from "./types";
import { MockProvider } from "./providers/mockProvider";
import { SwiggyProvider, isMockMode } from "./providers/swiggyProvider";
import {
  defaultRestaurants,
  burgerRestaurants,
  pizzaRestaurants,
  biryaniRestaurants,
  dosaRestaurants,
  pastaRestaurants,
} from "@/app/_lib/mockRestaurants";
import {
  generateFallbackRestaurant,
  generateMockMenuSections,
} from "@/app/_lib/menu";

const mockRestaurants = [
  ...defaultRestaurants,
  ...burgerRestaurants,
  ...pizzaRestaurants,
  ...biryaniRestaurants,
  ...dosaRestaurants,
  ...pastaRestaurants,
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function getFirst(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function unwrapCard(value: unknown): Record<string, unknown> {
  const first = asRecord(value);
  const card = asRecord(first.card);
  const nestedCard = asRecord(card.card);
  return Object.keys(nestedCard).length > 0
    ? nestedCard
    : Object.keys(card).length > 0
      ? card
      : first;
}

function mapMenuItem(rawItem: unknown): MenuItem {
  const item = asRecord(rawItem);
  const customizations = getFirst(item, [
    "customizations",
    "variants",
    "addons",
    "choices",
  ]);

  return {
    itemId: asString(getFirst(item, ["itemId", "id", "item_id", "skuId"])),
    name: asString(getFirst(item, ["name", "title", "itemName"])),
    description: asString(getFirst(item, ["description", "desc", "subtitle"])),
    price: asNumber(getFirst(item, ["price", "finalPrice", "defaultPrice", "cost"])),
    imageUrl: asString(getFirst(item, ["imageUrl", "image", "image_url"])) || undefined,
    isVeg: asBoolean(getFirst(item, ["isVeg", "veg", "is_veg"]), false),
    rating: asNumber(getFirst(item, ["rating", "avgRating"]), undefined as unknown as number),
    customizations: asArray(customizations)
      .map((customization) => {
        const record = asRecord(customization);
        return asString(getFirst(record, ["name", "title", "label"]), asString(customization));
      })
      .filter(Boolean),
  };
}

function mapSwiggyMenu(rawMenu: unknown): MenuSection[] {
  const root = asRecord(rawMenu);
  const candidateSections = asArray(
    getFirst(root, ["sections", "categories", "menu", "itemsByCategory", "cards"])
  );

  if (candidateSections.length > 0) {
    const sections = candidateSections
      .map((section) => {
        const sectionRecord = unwrapCard(section);
        const items = asArray(
          getFirst(sectionRecord, ["items", "menuItems", "itemCards", "dishes"])
        )
          .map((item) => {
            const record = unwrapCard(item);
            return mapMenuItem(record.item || record);
          })
          .filter((item) => item.itemId || item.name);

        return {
          name: asString(
            getFirst(sectionRecord, ["name", "title", "category", "categoryName"]),
            "Menu"
          ),
          items,
        };
      })
      .filter((section) => section.items.length > 0);

    if (sections.length > 0) return sections;
  }

  const flatItems = asArray(getFirst(root, ["items", "menuItems", "dishes"]))
    .map(mapMenuItem)
    .filter((item) => item.itemId || item.name);

  return flatItems.length > 0 ? [{ name: "Menu", items: flatItems }] : [];
}

class RestaurantService {
  private provider: RestaurantProvider;
  private mockMode: boolean;

  constructor() {
    this.mockMode = isMockMode();

    if (this.mockMode) {
      this.provider = new MockProvider();
    } else {
      this.provider = new SwiggyProvider();
    }
  }

  async searchRestaurants(query: string, location: { lat: number; lng: number }): Promise<ProviderRestaurant[]> {
    return this.provider.searchRestaurants(query, location);
  }

  async getRestaurantMenu(restaurantId: string): Promise<MenuSection[]> {
    if (this.mockMode) {
      const restaurant =
        mockRestaurants.find((item) => item.id === restaurantId || item.name === restaurantId) ??
        generateFallbackRestaurant(restaurantId);
      return generateMockMenuSections(restaurant);
    }

    const rawMenu = await this.provider.getRestaurantMenu(restaurantId);
    const sections = mapSwiggyMenu(rawMenu);
    return sections.length > 0
      ? sections
      : generateMockMenuSections(generateFallbackRestaurant(restaurantId));
  }

  async addToCart(restaurantId: string, itemId: string, quantity: number): Promise<any> {
    return this.provider.addToCart(restaurantId, itemId, quantity);
  }

  async getCart(): Promise<any> {
    return this.provider.getCart();
  }

  async applyCoupon(code: string): Promise<any> {
    return this.provider.applyCoupon(code);
  }

  async placeOrder(addressId: string): Promise<any> {
    return this.provider.placeOrder(addressId);
  }

  async trackOrder(orderId: string): Promise<any> {
    return this.provider.trackOrder(orderId);
  }
}

// Export a singleton instance
export const restaurantService = new RestaurantService();

export function getRestaurantMenu(restaurantId: string): Promise<MenuSection[]> {
  return restaurantService.getRestaurantMenu(restaurantId);
}
