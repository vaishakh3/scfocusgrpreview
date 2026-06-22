export type Decision = "pending" | "shortlisted" | "waitlist" | "rejected";

export type DataMode = "sample" | "private" | "supabase";

export type Applicant = {
  id: string;
  sourceRow?: number | null;
  submittedAt: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  branch: string | null;
  yearLevel: string | null;
  college: string | null;
  interestStatement: string | null;
  volunteeringExperience: string | null;
  linkedinUrl: string | null;
  dataQualityFlags: string[];
};

export type Reviewer = {
  id: string;
  name: string;
};

export type Review = {
  applicantId: string;
  reviewerId: string;
  decision: Decision;
  score: number | null;
  notes: string | null;
  updatedAt: string | null;
};

export type BootstrapPayload = {
  mode: DataMode;
  applicants: Applicant[];
  reviewers: Reviewer[];
  reviews: Review[];
};
