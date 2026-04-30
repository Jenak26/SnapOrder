import { getSession } from "@/app/_lib/session";
import type { NextRequest } from "next/server";

const homeUrl = (req: NextRequest, params: Record<string, string>) => {
  const url = new URL("/", req.url);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const session = await getSession();

  if (!code || !state || state !== session.oauthState) {
    return Response.redirect(
      homeUrl(req, { auth: "error", reason: "state_mismatch" })
    );
  }

  try {
    const response = await fetch("https://mcp.swiggy.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.SWIGGY_CLIENT_ID || "",
        client_secret: process.env.SWIGGY_CLIENT_SECRET || "",
        redirect_uri: process.env.SWIGGY_REDIRECT_URI || "",
        code_verifier: session.pkceVerifier || "",
      }),
    });

    if (!response.ok) {
      throw new Error("Token exchange failed");
    }

    const tokenData = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!tokenData.access_token) {
      throw new Error("Missing access token");
    }

    session.swiggyToken = tokenData.access_token;
    session.tokenExpiry = Date.now() + (tokenData.expires_in || 5 * 24 * 60 * 60) * 1000;
    delete session.pkceVerifier;
    delete session.oauthState;
    await session.save();

    return Response.redirect(homeUrl(req, { auth: "success" }));
  } catch {
    delete session.pkceVerifier;
    delete session.oauthState;
    await session.save();

    return Response.redirect(
      homeUrl(req, { auth: "error", reason: "token_exchange" })
    );
  }
}
