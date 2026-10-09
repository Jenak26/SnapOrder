export interface Restaurant {
  id?: string;
  name: string;
  cuisine: string;
  rating: number;
  reviews: string;
  distance: string;
  deliveryTime: string;
  priceRange: string;
  image: string;
  popular: string;
  badge?: string;
}

export const defaultRestaurants: Restaurant[] = [
  {
    name: "The Burger Joint",
    cuisine: "American • Burgers",
    rating: 4.9,
    reviews: "2.1k",
    distance: "0.3 km",
    deliveryTime: "18 min",
    priceRange: "₹₹",
    image: "/hero-burger.png",
    popular: "Smash Burger Combo",
    badge: "Top Rated",
  },
  {
    name: "Napoli Express",
    cuisine: "Italian • Pizza",
    rating: 4.7,
    reviews: "1.8k",
    distance: "0.8 km",
    deliveryTime: "25 min",
    priceRange: "₹₹₹",
    image: "/food-pizza.png",
    popular: "Margherita Pizza",
    badge: "Trending",
  },
  {
    name: "Aloha Bowl Co.",
    cuisine: "Hawaiian • Healthy",
    rating: 4.8,
    reviews: "950",
    distance: "1.2 km",
    deliveryTime: "22 min",
    priceRange: "₹₹",
    image: "/food-pokebowl.png",
    popular: "Salmon Poke Bowl",
  },
];

export const burgerRestaurants: Restaurant[] = [
  {
    name: "The Burger Joint",
    cuisine: "American • Burgers",
    rating: 4.9,
    reviews: "2.1k",
    distance: "0.3 km",
    deliveryTime: "18 min",
    priceRange: "₹₹",
    image: "/hero-burger.png",
    popular: "Smash Burger Combo",
    badge: "Top Rated",
  },
  {
    name: "Burger King",
    cuisine: "American • Fast Food",
    rating: 4.5,
    reviews: "5.4k",
    distance: "0.6 km",
    deliveryTime: "22 min",
    priceRange: "₹",
    image: "/hero-burger.png",
    popular: "Double Cheese Burger",
    badge: "Offers",
  },
  {
    name: "Shake Shack",
    cuisine: "American • Burgers",
    rating: 4.7,
    reviews: "3.2k",
    distance: "1.1 km",
    deliveryTime: "28 min",
    priceRange: "₹₹₹",
    image: "/hero-burger.png",
    popular: "BBQ Bacon Burger",
  },
];

export const pizzaRestaurants: Restaurant[] = [
  {
    name: "Napoli Express",
    cuisine: "Italian • Pizza",
    rating: 4.7,
    reviews: "1.8k",
    distance: "0.8 km",
    deliveryTime: "25 min",
    priceRange: "₹₹₹",
    image: "/food-pizza.png",
    popular: "Margherita Wood-Fired Pizza",
    badge: "Trending",
  },
  {
    name: "Domino's",
    cuisine: "Italian • Fast Food",
    rating: 4.3,
    reviews: "8.1k",
    distance: "0.4 km",
    deliveryTime: "20 min",
    priceRange: "₹",
    image: "/food-pizza.png",
    popular: "Pepperoni Pizza",
  },
  {
    name: "Pizza Hut",
    cuisine: "Italian • Pizza",
    rating: 4.4,
    reviews: "4.5k",
    distance: "1.0 km",
    deliveryTime: "30 min",
    priceRange: "₹₹",
    image: "/food-pizza.png",
    popular: "Farmhouse Pizza",
    badge: "Top Rated",
  },
];

export const biryaniRestaurants: Restaurant[] = [
  {
    name: "Paradise Biryani",
    cuisine: "Indian • Biryani",
    rating: 4.8,
    reviews: "12k",
    distance: "0.5 km",
    deliveryTime: "25 min",
    priceRange: "₹₹",
    image: "/food-pokebowl.png", // using existing image for now
    popular: "Hyderabadi Chicken Biryani",
    badge: "Legendary",
  },
  {
    name: "Behrouz Biryani",
    cuisine: "Indian • Mughlai",
    rating: 4.6,
    reviews: "5.6k",
    distance: "1.2 km",
    deliveryTime: "30 min",
    priceRange: "₹₹₹",
    image: "/food-pokebowl.png",
    popular: "Lucknowi Mutton Biryani",
  },
  {
    name: "Meghana Foods",
    cuisine: "Indian • Andhra",
    rating: 4.5,
    reviews: "8.9k",
    distance: "0.7 km",
    deliveryTime: "22 min",
    priceRange: "₹₹",
    image: "/food-pokebowl.png",
    popular: "Egg Dum Biryani",
    badge: "Trending",
  },
];

export const dosaRestaurants: Restaurant[] = [
  {
    name: "MTR",
    cuisine: "South Indian • Tiffin",
    rating: 4.7,
    reviews: "6.2k",
    distance: "0.4 km",
    deliveryTime: "15 min",
    priceRange: "₹",
    image: "/food-pokebowl.png",
    popular: "Masala Dosa",
    badge: "Heritage",
  },
  {
    name: "Vidyarthi Bhavan",
    cuisine: "South Indian • Snacks",
    rating: 4.9,
    reviews: "9.5k",
    distance: "0.9 km",
    deliveryTime: "20 min",
    priceRange: "₹",
    image: "/food-pokebowl.png",
    popular: "Mysore Masala Dosa",
    badge: "Top Rated",
  },
  {
    name: "Saravana Bhavan",
    cuisine: "South Indian • Meals",
    rating: 4.6,
    reviews: "4.1k",
    distance: "1.3 km",
    deliveryTime: "25 min",
    priceRange: "₹₹",
    image: "/food-pokebowl.png",
    popular: "Rava Onion Dosa",
  },
];

export const pastaRestaurants: Restaurant[] = [
  {
    name: "Olive Garden",
    cuisine: "Italian • Pasta",
    rating: 4.6,
    reviews: "3.2k",
    distance: "0.6 km",
    deliveryTime: "20 min",
    priceRange: "₹₹",
    image: "/food-pizza.png",
    popular: "Penne Arrabbiata",
    badge: "Trending",
  },
  {
    name: "Pasta Street",
    cuisine: "Italian • Continental",
    rating: 4.7,
    reviews: "1.5k",
    distance: "0.8 km",
    deliveryTime: "25 min",
    priceRange: "₹₹₹",
    image: "/food-pizza.png",
    popular: "Spaghetti Carbonara",
    badge: "Top Rated",
  },
  {
    name: "Little Italy",
    cuisine: "Italian • Vegetarian",
    rating: 4.5,
    reviews: "2.8k",
    distance: "1.4 km",
    deliveryTime: "30 min",
    priceRange: "₹₹₹",
    image: "/food-pizza.png",
    popular: "Alfredo Fettuccine",
  },
];

export function generateRecommendations(dish_name: string, cuisine: string): Restaurant[] {
  const lowerDish = dish_name.toLowerCase();
  const lowerCuisine = cuisine.toLowerCase();

  // 1. Exact matches for existing demos to preserve them
  if (lowerDish.includes("burger")) return burgerRestaurants;
  if (lowerDish.includes("pizza")) return pizzaRestaurants;
  if (lowerDish.includes("biryani")) return biryaniRestaurants;
  if (lowerDish.includes("dosa")) return dosaRestaurants;
  if (lowerDish.includes("pasta")) return pastaRestaurants;

  // 2. Intelligent category-based recommendations
  let restaurantTypes = [
    `${cuisine} Kitchen`,
    `The ${dish_name} Spot`,
    `Authentic ${cuisine} Dining`
  ];

  if (lowerDish.includes("tiramisu") || lowerDish.includes("dessert")) {
    restaurantTypes = ["Dessert Cafe", "Italian Bakery", "Sweet Treats"];
  } else if (lowerDish.includes("dal rice") || lowerDish.includes("dal")) {
    restaurantTypes = ["Home-style Indian Meals", "Thali Place", "Comfort Kitchen"];
  } else if (lowerDish.includes("sushi")) {
    restaurantTypes = ["Premium Japanese Restaurant", "Tokyo Sushi Bar", "Asian Fusion"];
  } else if (lowerDish.includes("ramen")) {
    restaurantTypes = ["Asian Noodle Place", "Ramen House", "Izakaya"];
  } else if (lowerDish.includes("paneer tikka") || lowerDish.includes("paneer")) {
    restaurantTypes = ["North Indian Restaurant", "Punjabi Dhaba", "Royal Tandoor"];
  } else if (lowerCuisine.includes("italian")) {
    restaurantTypes = ["Italian Trattoria", "Roma Kitchen", "Milano Dining"];
  } else if (lowerCuisine.includes("indian")) {
    restaurantTypes = ["Indian Curry House", "Spice Route", "Desi Kitchen"];
  }

  // 3. Generate the actual cards based on the selected types
  return [
    {
      name: restaurantTypes[0],
      cuisine: `${cuisine} • Premium`,
      rating: 4.8,
      reviews: "1.2k",
      distance: "0.5 km",
      deliveryTime: "20 min",
      priceRange: "₹₹",
      image: "/food-pokebowl.png", // fallback image
      popular: `Signature ${dish_name}`,
      badge: "Top Rated",
    },
    {
      name: restaurantTypes[1],
      cuisine: `${cuisine} • Authentic`,
      rating: 4.5,
      reviews: "850",
      distance: "1.1 km",
      deliveryTime: "25 min",
      priceRange: "₹",
      image: "/food-pizza.png", // fallback image
      popular: `${dish_name} Special`,
      badge: "Trending",
    },
    {
      name: restaurantTypes[2],
      cuisine: `${cuisine} • Casual`,
      rating: 4.7,
      reviews: "2.3k",
      distance: "1.5 km",
      deliveryTime: "30 min",
      priceRange: "₹₹₹",
      image: "/hero-burger.png", // fallback image
      popular: `Classic ${dish_name}`,
    },
  ];
}
