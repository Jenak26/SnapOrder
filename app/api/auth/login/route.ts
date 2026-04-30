import crypto from "crypto";
import { getSession } from "@/app/_lib/session";
import type { NextRequest } from "next/server";

const scope = "mcp:tools mcp:resources mcp:prompts";

export async function GET(req: NextRequest) {
  const clientId = process.env.SWIGGY_CLIENT_ID;
  const redirectUri = process.env.SWIGGY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return Response.redirect(
      new URL("/?auth=error&reason=missing_oauth_config", req.url)
    );
  }

  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  const state = crypto.randomBytes(16).toString("hex");

  const session = await getSession();
  session.pkceVerifier = verifier;
  session.oauthState = state;
  await session.save();

  const authUrl = new URL("https://mcp.swiggy.com/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", scope);

  return Response.redirect(authUrl);
}
