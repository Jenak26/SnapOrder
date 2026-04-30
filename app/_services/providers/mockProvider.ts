import type { RestaurantProvider, ProviderRestaurant } from "../types";
import { generateRecommendations } from "@/app/_lib/mockRestaurants";

export class MockProvider implements RestaurantProvider {
  async searchRestaurants(query: string, location: { lat: number; lng: number }): Promise<ProviderRestaurant[]> {
    // We pass the query as both dish and cuisine since the mock utility infers from it
    const mockData = generateRecommendations(query, query);

    return mockData.map((r) => {
      // Map mock price ranges to a numeric price
      let parsedPrice = 299;
      if (r.priceRange === "₹") parsedPrice = 149;
      else if (r.priceRange === "₹₹") parsedPrice = 349;
      else if (r.priceRange === "₹₹₹") parsedPrice = 499;

      return {
        name: r.name,
        eta: r.deliveryTime,
        rating: r.rating,
        // Mock a delivery fee based on distance
        deliveryFee: r.distance === "0.3 mi" ? 0 : 40,
        distance: r.distance,
        menuPreview: r.popular,
        image: r.image,
        priceRange: r.priceRange,
        price: parsedPrice,
      };
    });
  }

  async getRestaurantMenu(restaurantId: string): Promise<any> {
    return { success: true, data: { message: "Mock menu" } };
  }
  async addToCart(restaurantId: string, itemId: string, quantity: number): Promise<any> {
    return { success: true, data: { message: "Mock added to cart" } };
  }
  async getCart(): Promise<any> {
    return { success: true, data: { items: [] } };
  }
  async applyCoupon(code: string): Promise<any> {
    return { success: true, data: { message: "Mock coupon applied" } };
  }
  async placeOrder(addressId: string): Promise<any> {
    return { orderId: "mock-order-id", estimatedDelivery: "35 mins", status: "CONFIRMED", total: 0 };
  }
  async placeOrderSafe(addressId: string, onConfirm: (cart: any) => Promise<boolean>): Promise<any> {
    const cart = await this.getCart();
    const confirmed = await onConfirm(cart.data);
    if (!confirmed) throw new Error("Order cancelled");
    return this.placeOrder(addressId);
  }
  async checkRestaurantSwitch(newRestaurantId: string): Promise<any> {
    return { willClearCart: false };
  }
  async trackOrder(orderId: string): Promise<any> {
    return { success: true, data: { status: "Out for Delivery" } };
  }
}
