import { getSession } from "@/app/_lib/session";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getSession();
  session.destroy();

  return Response.redirect(new URL("/", req.url));
}
