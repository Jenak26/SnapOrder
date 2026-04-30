import type { NextRequest } from "next/server";
import { SwiggyProvider, isMockMode } from "@/app/_services/providers/swiggyProvider";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return Response.json(
      { success: false, error: "Missing restaurantId parameter" },
      { status: 400 }
    );
  }

  if (isMockMode()) {
    return Response.json({
      willClearCart: false,
      currentRestaurantName: "",
      currentItemCount: 0,
      currentTotal: 0,
    });
  }

  try {
    const provider = new SwiggyProvider();
    const warning = await provider.checkRestaurantSwitch(restaurantId);

    return Response.json({
      willClearCart: warning.willClearCart,
      currentRestaurantName: warning.currentRestaurantName ?? "",
      currentItemCount: warning.currentItemCount ?? 0,
      currentTotal: warning.currentTotal ?? 0,
    });
  } catch {
    return Response.json({
      willClearCart: false,
      currentRestaurantName: "",
      currentItemCount: 0,
      currentTotal: 0,
    });
  }
}
