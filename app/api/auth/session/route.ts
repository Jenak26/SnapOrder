import { getSession } from "@/app/_lib/session";

export async function GET() {
  const session = await getSession();
  const tokenExpiry = session.tokenExpiry || null;
  const remainingMs = tokenExpiry ? tokenExpiry - Date.now() : 0;
  const isConnected = Boolean(session.swiggyToken && remainingMs > 0);
  const expiresInMinutes = isConnected ? Math.max(0, Math.ceil(remainingMs / 60000)) : null;

  return Response.json({
    isConnected,
    tokenExpiry: isConnected ? tokenExpiry : null,
    expiresInMinutes,
    isExpiringSoon: isConnected ? remainingMs < 30 * 60 * 1000 : false,
  });
}
