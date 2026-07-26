import { NextRequest } from "next/server";
import { restaurantService } from "@/app/_services/restaurantService";
import { stageFor } from "@/app/_lib/mockMcp";

const isMockMode =
  process.env.NEXT_PUBLIC_MOCK_MODE === "true" ||
  process.env.RESTAURANT_DATA_PROVIDER !== "swiggy";

/**
 * First time each order was polled. Stages derive from elapsed time rather than
 * a poll counter, so the timeline is unaffected by poll interval, a refetch, or
 * a reload mid-demo.
 */
const firstSeen = new Map<string, number>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return Response.json(
        { success: false, error: "Missing orderId parameter" },
        { status: 400 }
      );
    }

    if (isMockMode) {
      let startedAt = firstSeen.get(orderId);
      if (!startedAt) {
        startedAt = Date.now();
        firstSeen.set(orderId, startedAt);
      }

      return Response.json({
        success: true,
        data: stageFor(Date.now() - startedAt),
      });
    }

    const trackingData = await restaurantService.trackOrder(orderId);

    return Response.json({ success: true, data: trackingData });
  } catch (error: unknown) {
    console.error("Tracking error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
