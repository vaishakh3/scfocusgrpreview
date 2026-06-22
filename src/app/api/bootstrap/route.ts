import { accessDeniedResponse, isAccessAllowed } from "@/lib/access";
import { getBootstrapPayload } from "@/lib/review-data";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAccessAllowed(request)) {
    return accessDeniedResponse();
  }

  try {
    return Response.json(await getBootstrapPayload());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load review data.";
    return Response.json({ error: message }, { status: 500 });
  }
}
