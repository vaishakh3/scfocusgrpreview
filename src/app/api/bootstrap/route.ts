import { getBootstrapPayload } from "@/lib/review-data";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await getBootstrapPayload());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load review data.";
    return Response.json({ error: message }, { status: 500 });
  }
}
