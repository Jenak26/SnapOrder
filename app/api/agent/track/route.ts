import { NextRequest } from "next/server";
import { restaurantService } from "@/app/_services/restaurantService";

const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true' || process.env.RESTAURANT_DATA_PROVIDER !== 'swiggy';

// Global memory map to track mock polling cycles across requests (demo purposes only)
const mockOrderCycles = new Map<string, number>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return Response.json({ success: false, error: "Missing orderId parameter" }, { status: 400 });
    }

    if (isMockMode) {
      // Simulate cycling through states every time this endpoint is polled
      const cycle = mockOrderCycles.get(orderId) || 0;
      mockOrderCycles.set(orderId, cycle + 1);

      let status = "ACCEPTED";
      let stage = 0;
      let driverName = null;
      let eta = "35 mins";

      if (cycle >= 1 && cycle < 3) {
        status = "PREPARING";
        stage = 1;
        eta = "25 mins";
      } else if (cycle >= 3 && cycle < 5) {
        status = "OUT_FOR_DELIVERY";
        stage = 2;
        driverName = "Ramesh Kumar";
        eta = "10 mins";
      } else if (cycle >= 5) {
        status = "DELIVERED";
        stage = 3;
        driverName = "Ramesh Kumar";
        eta = "Arrived";
      }

      return Response.json({
        success: true,
        data: {
          status,
          stage,
          driverName,
          eta
        }
      });
    }

    // Live mode using Swiggy MCP integration
    const trackingData = await restaurantService.trackOrder(orderId);
    
    return Response.json({
      success: true,
      data: trackingData // Assuming trackingData shape matches or mapping if needed
    });

  } catch (error: any) {
    console.error("Tracking error:", error);
    return Response.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
