import fs from "node:fs";
import path from "node:path";
import { sampleApplicants, sampleReviewers } from "@/lib/sample-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { Applicant, BootstrapPayload, Decision, Review, Reviewer } from "@/lib/types";

type ReviewerRow = {
  id: string;
  name: string;
};

type ApplicantRow = {
  id: string;
  source_row: number | null;
  submitted_at: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  branch: string | null;
  year_level: string | null;
  college: string | null;
  interest_statement: string | null;
  volunteering_experience: string | null;
  linkedin_url: string | null;
  data_quality_flags: string[] | null;
};

type ReviewRow = {
  applicant_id: string;
  reviewer_id: string;
  decision: Decision;
  score: number | null;
  notes: string | null;
  updated_at: string | null;
};

type PrivateApplicantsFile = {
  applicants?: ApplicantRow[];
};

export function hasSupabaseConfig() {
  return Boolean((process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function mapReviewer(row: ReviewerRow): Reviewer {
  return {
    id: row.id,
    name: row.name,
  };
}

function mapApplicant(row: ApplicantRow): Applicant {
  return {
    id: row.id,
    sourceRow: row.source_row,
    submittedAt: row.submitted_at,
    name: row.name,
    email: row.email,
    phone: row.phone,
    branch: row.branch,
    yearLevel: row.year_level,
    college: row.college,
    interestStatement: row.interest_statement,
    volunteeringExperience: row.volunteering_experience,
    linkedinUrl: row.linkedin_url,
    dataQualityFlags: row.data_quality_flags || [],
  };
}

function mapReview(row: ReviewRow): Review {
  return {
    applicantId: row.applicant_id,
    reviewerId: row.reviewer_id,
    decision: row.decision,
    score: row.score,
    notes: row.notes,
    updatedAt: row.updated_at,
  };
}

function getPrivateApplicants() {
  const filePath = path.join(process.cwd(), "private", "applicants.json");

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as PrivateApplicantsFile;
    const applicants = Array.isArray(parsed.applicants) ? parsed.applicants.map(mapApplicant) : [];
    return applicants.length ? applicants : null;
  } catch {
    return null;
  }
}

export async function getBootstrapPayload(): Promise<BootstrapPayload> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const privateApplicants = getPrivateApplicants();

    return {
      mode: privateApplicants ? "private" : "sample",
      applicants: privateApplicants || sampleApplicants,
      reviewers: sampleReviewers,
      reviews: [],
    };
  }

  const [reviewersResult, applicantsResult, reviewsResult] = await Promise.all([
    supabase.from("sfg_reviewers").select("id, name").order("sort_order", { ascending: true }),
    supabase
      .from("sfg_applicants")
      .select(
        "id, source_row, submitted_at, name, email, phone, branch, year_level, college, interest_statement, volunteering_experience, linkedin_url, data_quality_flags",
      )
      .order("submitted_at", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true }),
    supabase.from("sfg_reviews").select("applicant_id, reviewer_id, decision, score, notes, updated_at"),
  ]);

  if (reviewersResult.error) {
    throw reviewersResult.error;
  }

  if (applicantsResult.error) {
    throw applicantsResult.error;
  }

  if (reviewsResult.error) {
    throw reviewsResult.error;
  }

  const reviewers = reviewersResult.data?.length
    ? reviewersResult.data.map(mapReviewer)
    : sampleReviewers;

  return {
    mode: "supabase",
    reviewers,
    applicants: (applicantsResult.data || []).map(mapApplicant),
    reviews: (reviewsResult.data || []).map(mapReview),
  };
}

export async function saveReview(input: {
  applicantId: string;
  reviewerId: string;
  decision: Decision;
  score: number | null;
  notes: string | null;
  clear?: boolean;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  if (input.clear) {
    const { error } = await supabase
      .from("sfg_reviews")
      .delete()
      .eq("applicant_id", input.applicantId)
      .eq("reviewer_id", input.reviewerId);

    if (error) {
      throw error;
    }

    return null;
  }

  const payload = {
    applicant_id: input.applicantId,
    reviewer_id: input.reviewerId,
    decision: input.decision,
    score: input.score,
    notes: input.notes,
  };

  const { data, error } = await supabase
    .from("sfg_reviews")
    .upsert(payload, { onConflict: "applicant_id,reviewer_id" })
    .select("applicant_id, reviewer_id, decision, score, notes, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return mapReview(data);
}
