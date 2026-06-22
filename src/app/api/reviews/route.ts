import { saveReview } from "@/lib/review-data";
import type { Decision } from "@/lib/types";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const decisions = new Set<Decision>(["pending", "shortlisted", "waitlist", "rejected"]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      applicantId?: string;
      reviewerId?: string;
      decision?: Decision;
      score?: number | null;
      clear?: boolean;
    };

    if (!body.applicantId || !body.reviewerId) {
      return Response.json({ error: "Applicant and reviewer are required." }, { status: 400 });
    }

    if (!body.clear && (!body.decision || !decisions.has(body.decision))) {
      return Response.json({ error: "A valid decision is required." }, { status: 400 });
    }

    const score = typeof body.score === "number" && body.score >= 1 && body.score <= 5 ? body.score : null;
    const review = await saveReview({
      applicantId: body.applicantId,
      reviewerId: body.reviewerId,
      decision: body.decision || "pending",
      score,
      clear: body.clear,
    });

    return Response.json({ review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save review.";
    return Response.json({ error: message }, { status: 500 });
  }
}
