import { type Restaurant } from "@/app/_lib/mockRestaurants";
import type { MenuItem, MenuSection } from "@/app/_services/types";

interface MockMenuItem extends MenuItem {
  bestseller?: boolean;
}

function hashStr(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function generateMockMenuSections(restaurant: Restaurant): MenuSection[] {
  const seed = hashStr(restaurant.name);
  const isIndian = restaurant.cuisine.toLowerCase().includes("indian");
  const isPizza = restaurant.cuisine.toLowerCase().includes("pizza");
  const isBurger = restaurant.cuisine.toLowerCase().includes("burger");
  const restaurantId = restaurant.id || restaurant.name;
  const basePrice =
    restaurant.priceRange === "₹" || restaurant.priceRange === "â‚¹"
      ? 149
      : restaurant.priceRange === "₹₹" || restaurant.priceRange === "â‚¹â‚¹"
        ? 299
        : 499;

  const itemsBySection: Record<string, MockMenuItem[]> = {
    Recommended: [
      {
        itemId: `${restaurantId}-popular`,
        name: restaurant.popular,
        price: basePrice,
        description: `Our signature preparation. Highly recommended by ${restaurant.reviews} reviewers.`,
        isVeg: isIndian ? seed % 2 === 0 : !isBurger,
        rating: restaurant.rating,
        bestseller: true,
      },
    ],
    Combos: [
      {
        itemId: `${restaurantId}-combo`,
        name: `${restaurant.popular.split(" ")[0]} Family Combo`,
        price: Math.floor(basePrice * 2.5),
        description: "Perfect for sharing. Includes sides and beverages.",
        isVeg: isIndian ? seed % 2 === 0 : !isBurger,
      },
    ],
    "Main Course": [],
    Desserts: [],
  };

  const genericMains = isPizza
    ? ["Garlic Breadsticks", "Farmhouse Special", "Cheese Burst Upgrade"]
    : isBurger
      ? ["Peri Peri Fries", "Loaded Nachos", "Thick Cold Coffee"]
      : isIndian
        ? ["Paneer Butter Masala", "Garlic Naan", "Gulab Jamun"]
        : ["House Salad", "Special Soup", "Fudge Brownie"];

  genericMains.forEach((main, i) => {
    const section = i === 2 ? "Desserts" : "Main Course";
    itemsBySection[section].push({
      itemId: `${restaurantId}-main-${i}`,
      name: main,
      price: Math.floor(basePrice * (0.5 + i * 0.2)),
      description: "Freshly prepared with authentic ingredients.",
      isVeg: true,
      bestseller: i === 0,
    });
  });

  return Object.entries(itemsBySection)
    .filter(([, items]) => items.length > 0)
    .map(([name, items]) => ({ name, items }));
}

export function generateFallbackRestaurant(restaurantId: string): Restaurant {
  return {
    id: restaurantId,
    name: restaurantId,
    cuisine: "House Specials",
    rating: 4.5,
    reviews: "500",
    distance: "1.0 km",
    deliveryTime: "25 min",
    priceRange: "₹₹",
    image: "/food-pizza.png",
    popular: "Signature Special",
  };
}
