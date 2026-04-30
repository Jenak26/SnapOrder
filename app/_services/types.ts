export interface ProviderRestaurant {
  id?: string;
  name: string;
  eta: string;
  rating: number;
  deliveryFee: number; // Storing as a number for easier cart logic
  distance: string;
  menuPreview: string; // The popular/matching dish name
  image: string;
  priceRange?: string; // Optional metadata, default to something if missing
  price: number; // The exact price of the matched dish
}

export interface RestaurantProvider {
  /**
   * Search for restaurants matching the query.
   * @param query The search term (e.g. "Pizza", "Masala Dosa")
   * @param location User's latitude and longitude
   */
  searchRestaurants(query: string, location: { lat: number; lng: number }): Promise<ProviderRestaurant[]>;
  
  getRestaurantMenu(restaurantId: string): Promise<any>;
  addToCart(restaurantId: string, itemId: string, quantity: number): Promise<any>;
  getCart(): Promise<any>;
  applyCoupon(code: string): Promise<any>;
  placeOrder(addressId: string): Promise<any>;
  placeOrderSafe(addressId: string, onConfirm: (cart: any) => Promise<boolean>): Promise<any>;
  checkRestaurantSwitch(newRestaurantId: string): Promise<any>;
  trackOrder(orderId: string): Promise<any>;
}

export interface MenuItem {
  itemId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  rating?: number;
  customizations?: string[];
}

export interface MenuSection {
  name: string;
  items: MenuItem[];
}

// ── Agent/Chat Types ─────────────────────────────────────
export interface AgentCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface AgentCart {
  restaurantId: string;
  restaurantName: string;
  items: AgentCartItem[];
  subtotal: number;
}

export interface ToolCallEvent {
  name: string;
  args?: any;
  status: "running" | "done" | "error";
  resultSummary?: string;
}

export interface ChatMessage {
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  toolCalls?: ToolCallEvent[];
}
