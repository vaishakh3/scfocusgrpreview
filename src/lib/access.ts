import type { NextRequest } from "next/server";

export function isAccessAllowed(request: NextRequest) {
  const expected = process.env.REVIEW_ACCESS_CODE?.trim();

  if (!expected) {
    return true;
  }

  return request.headers.get("x-review-access-code")?.trim() === expected;
}

export function accessDeniedResponse() {
  return Response.json({ error: "Access code required." }, { status: 401 });
}
