import { type NextRequest } from "next/server";
import type {
  AnalyzeImageResult,
  AnalyzeResponse,
  AnalyzeError,
  MatchResult,
} from "@/app/_lib/types";
import { restaurantService } from "@/app/_services/restaurantService";
import { GoogleGenAI } from "@google/genai";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * POST /api/analyze-image
 *
 * Accepts multipart/form-data with a single "image" field.
 * Validates type + size, then calls Gemini API for real image recognition.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    
    // Parse coordinates, default to Chennai if missing or invalid
    const rawLat = formData.get("lat");
    const rawLng = formData.get("lng");
    const lat = Number(rawLat) || 13.0827;
    const lng = Number(rawLng) || 80.2707;

    // ── Validation ───────────────────────────────────────
    if (!file || !(file instanceof File)) {
      return Response.json(
        { success: false, error: "No image file provided." } satisfies AnalyzeError,
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        {
          success: false,
          error: `Unsupported file type "${file.type}". Use JPG, PNG, or WebP.`,
        } satisfies AnalyzeError,
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return Response.json(
        {
          success: false,
          error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 10 MB.`,
        } satisfies AnalyzeError,
        { status: 400 }
      );
    }

    // Check for API Key
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing from environment variables");
      return Response.json(
        { success: false, error: "Server configuration error: Missing API Key." } satisfies AnalyzeError,
        { status: 500 }
      );
    }

    // ── Call Gemini AI ───────────────────────────────────
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Convert File to Base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `You are an expert food identification AI. Analyze this image and return a strict JSON response.
If the image contains food, identify the dish and return:
{
  "dish_name": "Name of the dish (e.g. Masala Dosa, Sushi, Tiramisu, Dal Rice)",
  "cuisine": "Cuisine type (e.g. South Indian, Japanese, Italian, North Indian)",
  "confidence": <number between 0 and 1>,
  "search_query": "A good search query to find this food near me (e.g. 'masala dosa near me')"
}
Optimize for accurate identification of both Indian and global foods.
If the image does NOT contain food, return EXACTLY:
{
  "dish_name": "Not Food",
  "cuisine": "Unknown",
  "confidence": 0,
  "search_query": ""
}`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: file.type,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    // `text` is a getter property in @google/genai v1.x, not a method
    const jsonText = aiResponse.text;
    if (!jsonText) {
      throw new Error("Empty response from Gemini API");
    }

    let aiResult: Record<string, unknown>;
    try {
      aiResult = JSON.parse(jsonText);
    } catch {
      console.error("[analyze-image] Failed to parse Gemini response:", jsonText);
      throw new Error("Gemini returned invalid JSON");
    }

    // Handle non-food images gracefully
    if (
      aiResult.dish_name === "Not Food" ||
      aiResult.confidence === 0 ||
      !aiResult.dish_name
    ) {
      return Response.json(
        {
          success: false,
          error: "We couldn't detect any food in this image. Please try another photo.",
        } satisfies AnalyzeError,
        { status: 400 }
      );
    }

    // Map the result to our expected type with safe fallbacks
    const analysis: AnalyzeImageResult = {
      dish_name: String(aiResult.dish_name),
      cuisine: String(aiResult.cuisine ?? "Unknown"),
      confidence: Number(aiResult.confidence) || 0.5,
      search_query: String(aiResult.search_query ?? `${aiResult.dish_name} near me`),
    };

    // Use the new MCP-compatible restaurant service layer with actual location
    const rawResults = await restaurantService.searchRestaurants(analysis.dish_name, { lat, lng });

    // Map service format to UI MatchResult format
    const results: MatchResult[] = rawResults.map((r, i) => ({
      name: r.menuPreview,     // We show the matched dish name in the UI as the primary title
      restaurant: r.name,
      distance: r.distance,
      price: `₹${r.price}`,    // Add formatting
      match: 95 - i * 5,       // UI expects a match percentage
      rating: r.rating,
      deliveryTime: r.eta,
      image: r.image,
    }));

    const response: AnalyzeResponse = {
      success: true,
      analysis,
      results,
    };

    return Response.json(response);
  } catch (err) {
    console.error("[analyze-image]", err);
    return Response.json(
      { success: false, error: "Failed to analyze image. Please try again." } satisfies AnalyzeError,
      { status: 500 }
    );
  }
}
