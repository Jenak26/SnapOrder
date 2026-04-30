import type { NextRequest } from "next/server";
import { getRestaurantMenu } from "@/app/_services/restaurantService";
import {
  generateFallbackRestaurant,
  generateMockMenuSections,
} from "@/app/_lib/menu";

const TIMEOUT_MS = 10000;

function fallbackSections(restaurantId: string) {
  return generateMockMenuSections(generateFallbackRestaurant(restaurantId));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return Response.json(
      { success: false, error: "Missing restaurantId parameter" },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const sections = await Promise.race([
      getRestaurantMenu(restaurantId),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new Error("Menu request timed out"));
        });
      }),
    ]);

    return Response.json({ success: true, sections });
  } catch {
    return Response.json({
      success: true,
      sections: fallbackSections(restaurantId),
      fallback: true,
    });
  } finally {
    clearTimeout(timeout);
  }
}
