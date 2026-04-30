import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  swiggyToken?: string;
  tokenExpiry?: number;
  pkceVerifier?: string;
  oauthState?: string;
}

const getSessionSecret = () => {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long");
  }

  return secret;
};

export const sessionOptions = (): SessionOptions => ({
  cookieName: "snaporder-session",
  password: getSessionSecret(),
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 5 * 24 * 60 * 60,
  },
});

export async function getSession(
  _req?: Request,
  _res?: Response
): Promise<IronSession<SessionData>> {
  void _req;
  void _res;

  return getIronSession<SessionData>(await cookies(), sessionOptions());
}
