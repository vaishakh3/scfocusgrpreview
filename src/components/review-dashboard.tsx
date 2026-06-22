"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  RotateCcw,
  Save,
  Search,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Applicant, BootstrapPayload, Decision, Review } from "@/lib/types";

type StatusFilter = Decision | "all";

const REVIEWER_STORAGE_KEY = "scfocusgrpreview:reviewer";
const SAMPLE_REVIEWS_STORAGE_KEY = "scfocusgrpreview:sample-reviews";

const decisionMeta: Record<Decision, { label: string; icon: typeof Clock3 }> = {
  pending: { label: "Pending", icon: Clock3 },
  shortlisted: { label: "Shortlist", icon: CheckCircle2 },
  waitlist: { label: "Waitlist", icon: Clock3 },
  rejected: { label: "Reject", icon: XCircle },
};

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "shortlisted", label: "Shortlist" },
  { value: "waitlist", label: "Waitlist" },
  { value: "rejected", label: "Rejected" },
];

function reviewKey(reviewerId: string, applicantId: string) {
  return `${reviewerId}:${applicantId}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not timestamped";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusOf(review: Review | undefined): Decision {
  return review?.decision || "pending";
}

function loadSampleReviews() {
  try {
    const value = window.localStorage.getItem(SAMPLE_REVIEWS_STORAGE_KEY);
    return value ? (JSON.parse(value) as Review[]) : [];
  } catch {
    return [];
  }
}

function saveSampleReviews(reviews: Review[]) {
  try {
    window.localStorage.setItem(SAMPLE_REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  } catch {}
}

function searchableText(applicant: Applicant) {
  return [
    applicant.name,
    applicant.email,
    applicant.branch,
    applicant.yearLevel,
    applicant.college,
    applicant.interestStatement,
    applicant.volunteeringExperience,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function ReviewDashboard() {
  const [payload, setPayload] = useState<BootstrapPayload | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [selectedApplicantId, setSelectedApplicantId] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draftState, setDraftState] = useState<{ key: string; score: number | null; notes: string }>({
    key: "",
    score: null,
    notes: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/bootstrap");

      const data = (await response.json()) as BootstrapPayload | { error?: string };

      if (!response.ok) {
        throw new Error("error" in data && data.error ? data.error : "Unable to load review data.");
      }

      const bootstrap = data as BootstrapPayload;
      const initialReviews = bootstrap.mode === "sample" ? loadSampleReviews() : bootstrap.reviews;
      const storedReviewer = window.localStorage.getItem(REVIEWER_STORAGE_KEY) || "";
      const reviewer = bootstrap.reviewers.find((item) => item.id === storedReviewer) || bootstrap.reviewers[0];

      setPayload(bootstrap);
      setReviews(initialReviews);
      setSelectedReviewerId(reviewer?.id || "");
      setSelectedApplicantId(bootstrap.applicants[0]?.id || "");
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load review data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    if (selectedReviewerId) {
      window.localStorage.setItem(REVIEWER_STORAGE_KEY, selectedReviewerId);
    }
  }, [selectedReviewerId]);

  const reviewLookup = useMemo(() => {
    const map = new Map<string, Review>();
    reviews.forEach((review) => {
      map.set(reviewKey(review.reviewerId, review.applicantId), review);
    });
    return map;
  }, [reviews]);

  const sortedApplicants = useMemo(() => {
    return [...(payload?.applicants || [])].sort((left, right) => {
      const leftTime = left.submittedAt ? Date.parse(left.submittedAt) : Number.MAX_SAFE_INTEGER;
      const rightTime = right.submittedAt ? Date.parse(right.submittedAt) : Number.MAX_SAFE_INTEGER;

      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      return left.name.localeCompare(right.name);
    });
  }, [payload?.applicants]);

  const yearOptions = useMemo(() => {
    return Array.from(new Set(sortedApplicants.map((applicant) => applicant.yearLevel).filter(Boolean) as string[]));
  }, [sortedApplicants]);

  const filteredApplicants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortedApplicants.filter((applicant) => {
      const review = reviewLookup.get(reviewKey(selectedReviewerId, applicant.id));
      const decision = statusOf(review);

      if (statusFilter !== "all" && decision !== statusFilter) {
        return false;
      }

      if (yearFilter !== "all" && applicant.yearLevel !== yearFilter) {
        return false;
      }

      if (normalizedQuery && !searchableText(applicant).includes(normalizedQuery)) {
        return false;
      }

      return true;
    });
  }, [query, reviewLookup, selectedReviewerId, sortedApplicants, statusFilter, yearFilter]);

  const activeApplicantId = filteredApplicants.some((applicant) => applicant.id === selectedApplicantId)
    ? selectedApplicantId
    : filteredApplicants[0]?.id || "";

  const selectedApplicant = useMemo(() => {
    return sortedApplicants.find((applicant) => applicant.id === activeApplicantId) || null;
  }, [activeApplicantId, sortedApplicants]);

  const selectedReview = selectedApplicant
    ? reviewLookup.get(reviewKey(selectedReviewerId, selectedApplicant.id))
    : undefined;

  const activeReviewKey = selectedApplicant ? reviewKey(selectedReviewerId, selectedApplicant.id) : "";
  const activeDraft =
    draftState.key === activeReviewKey
      ? draftState
      : {
          key: activeReviewKey,
          score: selectedReview?.score ?? null,
          notes: selectedReview?.notes || "",
        };

  const stats = useMemo(() => {
    return sortedApplicants.reduce(
      (accumulator, applicant) => {
        const review = reviewLookup.get(reviewKey(selectedReviewerId, applicant.id));
        const decision = statusOf(review);
        accumulator.total += 1;
        accumulator[decision] += 1;
        return accumulator;
      },
      { total: 0, pending: 0, shortlisted: 0, waitlist: 0, rejected: 0 },
    );
  }, [reviewLookup, selectedReviewerId, sortedApplicants]);

  const selectedIndex = selectedApplicant
    ? filteredApplicants.findIndex((applicant) => applicant.id === selectedApplicant.id) + 1
    : 0;

  function replaceReview(nextReview: Review | null, reviewerId: string, applicantId: string) {
    setReviews((currentReviews) => {
      const nextReviews = currentReviews.filter(
        (review) => review.reviewerId !== reviewerId || review.applicantId !== applicantId,
      );

      if (nextReview) {
        nextReviews.push(nextReview);
      }

      if (payload?.mode !== "supabase") {
        saveSampleReviews(nextReviews);
      }

      return nextReviews;
    });
  }

  async function persistReview(decision: Decision, clear = false) {
    if (!payload || !selectedApplicant || !selectedReviewerId) {
      return;
    }

    const nextReview: Review = {
      applicantId: selectedApplicant.id,
      reviewerId: selectedReviewerId,
      decision,
      score: activeDraft.score,
      notes: activeDraft.notes.trim() || null,
      updatedAt: new Date().toISOString(),
    };

    setSaving(true);
    setError("");

    try {
      if (payload.mode !== "supabase") {
        replaceReview(clear ? null : nextReview, selectedReviewerId, selectedApplicant.id);
        if (clear) {
          setDraftState({ key: activeReviewKey, score: null, notes: "" });
        }
        return;
      }

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicantId: selectedApplicant.id,
          reviewerId: selectedReviewerId,
          decision,
          score: activeDraft.score,
          notes: activeDraft.notes,
          clear,
        }),
      });

      const result = (await response.json()) as { review?: Review | null; error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Unable to save review.");
      }

      replaceReview(result.review || null, selectedReviewerId, selectedApplicant.id);
      if (clear) {
        setDraftState({ key: activeReviewKey, score: null, notes: "" });
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save review.");
    } finally {
      setSaving(false);
    }
  }

  const modeLabel = payload?.mode === "supabase" ? "Supabase" : payload?.mode === "private" ? "Private" : "Sample";
  const currentDecision = statusOf(selectedReview);
  const DecisionIcon = decisionMeta[currentDecision].icon;

  if (loading && !payload) {
    return (
      <main className="loading-screen">
        <Loader2 className="spin-icon" aria-hidden="true" />
        <span>Loading review desk</span>
      </main>
    );
  }

  if (error && !payload) {
    return (
      <main className="error-screen">
        <div className="setup-panel">
          <AlertCircle size={28} aria-hidden="true" />
          <div>
            <p className="eyebrow">Setup</p>
            <h1>Review data unavailable</h1>
          </div>
          <p className="panel-copy">{error}</p>
          <button className="primary-action" onClick={() => void loadData()} type="button">
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="review-shell">
      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">IEEE Sensors Council Kerala Chapter</p>
          <div className="brand-row">
            <h1>Software Focus Group Review</h1>
            <span className="mode-chip">{modeLabel}</span>
          </div>
        </div>

        <label className="reviewer-select field-stack">
          <span>Reviewer</span>
          <select value={selectedReviewerId} onChange={(event) => setSelectedReviewerId(event.target.value)}>
            {(payload?.reviewers || []).map((reviewer) => (
              <option key={reviewer.id} value={reviewer.id}>
                {reviewer.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="stat-grid" aria-label="Review summary">
        <div className="stat-item">
          <span>Total</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-item">
          <span>Pending</span>
          <strong>{stats.pending}</strong>
        </div>
        <div className="stat-item">
          <span>Shortlist</span>
          <strong>{stats.shortlisted}</strong>
        </div>
        <div className="stat-item">
          <span>Waitlist</span>
          <strong>{stats.waitlist}</strong>
        </div>
        <div className="stat-item">
          <span>Rejected</span>
          <strong>{stats.rejected}</strong>
        </div>
      </section>

      <div className="review-grid">
        <aside className="queue-pane">
          <div className="toolbar">
            <label className="search-field">
              <Search size={17} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search applicants"
                type="search"
              />
            </label>
            <select className="compact-select" value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
              <option value="all">All years</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-tabs" role="tablist" aria-label="Decision filters">
            {statusFilters.map((filter) => (
              <button
                className={filter.value === statusFilter ? "filter-tab is-active" : "filter-tab"}
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="queue-meta">
            <span>{filteredApplicants.length} shown</span>
            <span>{stats.total} applicants</span>
          </div>

          <div className="applicant-list">
            {filteredApplicants.map((applicant) => {
              const review = reviewLookup.get(reviewKey(selectedReviewerId, applicant.id));
              const decision = statusOf(review);
              return (
                <button
                  className={applicant.id === activeApplicantId ? "applicant-row is-selected" : "applicant-row"}
                  key={applicant.id}
                  onClick={() => setSelectedApplicantId(applicant.id)}
                  type="button"
                >
                  <span className="row-head">
                    <span className="row-name">{applicant.name}</span>
                    <span className="decision-dot" data-decision={decision} />
                  </span>
                  <span className="row-subline">{applicant.college || applicant.branch || "No college listed"}</span>
                  <span className="row-meta">
                    <span>{applicant.yearLevel || "Year unknown"}</span>
                    <span>{decisionMeta[decision].label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="workspace-pane">
          {selectedApplicant ? (
            <>
              <header className="candidate-header">
                <div>
                  <p className="eyebrow">Current applicant</p>
                  <h2>{selectedApplicant.name}</h2>
                </div>
                <div className="status-badge" data-decision={currentDecision}>
                  <DecisionIcon size={17} aria-hidden="true" />
                  {decisionMeta[currentDecision].label}
                </div>
              </header>

              <div className="action-bar">
                <span className="muted">
                  {selectedIndex} of {filteredApplicants.length || 0}
                </span>
                <div className="decision-actions">
                  <button
                    className="decision-button shortlist"
                    disabled={saving}
                    onClick={() => void persistReview("shortlisted")}
                    title="Shortlist applicant"
                    type="button"
                  >
                    <CheckCircle2 size={17} aria-hidden="true" />
                    Shortlist
                  </button>
                  <button
                    className="decision-button waitlist"
                    disabled={saving}
                    onClick={() => void persistReview("waitlist")}
                    title="Move applicant to waitlist"
                    type="button"
                  >
                    <Clock3 size={17} aria-hidden="true" />
                    Waitlist
                  </button>
                  <button
                    className="decision-button reject"
                    disabled={saving}
                    onClick={() => void persistReview("rejected")}
                    title="Reject applicant"
                    type="button"
                  >
                    <XCircle size={17} aria-hidden="true" />
                    Reject
                  </button>
                  <button
                    className="icon-action"
                    disabled={saving}
                    onClick={() => void persistReview("pending", true)}
                    title="Clear review"
                    type="button"
                  >
                    <RotateCcw size={17} aria-hidden="true" />
                    <span className="sr-only">Clear review</span>
                  </button>
                </div>
              </div>

              {error ? <p className="inline-error">{error}</p> : null}

              <section className="meta-grid">
                <div>
                  <span className="meta-label">Email</span>
                  <p>{selectedApplicant.email || "-"}</p>
                </div>
                <div>
                  <span className="meta-label">Phone</span>
                  <p>{selectedApplicant.phone || "-"}</p>
                </div>
                <div>
                  <span className="meta-label">Branch</span>
                  <p>{selectedApplicant.branch || "-"}</p>
                </div>
                <div>
                  <span className="meta-label">Year</span>
                  <p>{selectedApplicant.yearLevel || "-"}</p>
                </div>
                <div>
                  <span className="meta-label">College</span>
                  <p>{selectedApplicant.college || "-"}</p>
                </div>
                <div>
                  <span className="meta-label">Submitted</span>
                  <p>{formatDate(selectedApplicant.submittedAt)}</p>
                </div>
              </section>

              <section className="review-editor">
                <div className="score-control">
                  <div>
                    <span className="meta-label">Score</span>
                  <strong>{activeDraft.score ? `${activeDraft.score}/5` : "No score"}</strong>
                  </div>
                  <input
                    aria-label="Review score"
                    max="5"
                    min="1"
                    onChange={(event) =>
                      setDraftState({ ...activeDraft, score: Number(event.target.value) })
                    }
                    type="range"
                    value={activeDraft.score || 3}
                  />
                  <button
                    className="text-button"
                    onClick={() => setDraftState({ ...activeDraft, score: null })}
                    type="button"
                  >
                    Clear score
                  </button>
                </div>

                <label className="notes-field">
                  <span className="meta-label">Reviewer notes</span>
                  <textarea
                    value={activeDraft.notes}
                    onChange={(event) => setDraftState({ ...activeDraft, notes: event.target.value })}
                    rows={4}
                  />
                </label>

                <button
                  className="save-button"
                  disabled={saving}
                  onClick={() => void persistReview(currentDecision)}
                  type="button"
                >
                  {saving ? <Loader2 className="mini-spin" size={17} aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}
                  Save review
                </button>
              </section>

              {selectedApplicant.dataQualityFlags.length ? (
                <div className="quality-strip">
                  <AlertCircle size={16} aria-hidden="true" />
                  {selectedApplicant.dataQualityFlags.join(", ")}
                </div>
              ) : null}

              <section className="answer-section">
                <div className="section-title">Interest and contribution</div>
                <article>{selectedApplicant.interestStatement || "No response submitted."}</article>
              </section>

              <section className="answer-section">
                <div className="section-title">Volunteering experience</div>
                <article>{selectedApplicant.volunteeringExperience || "No response submitted."}</article>
              </section>

              <section className="link-section">
                <span className="meta-label">LinkedIn</span>
                {selectedApplicant.linkedinUrl ? (
                  <a href={selectedApplicant.linkedinUrl} rel="noreferrer" target="_blank">
                    Open profile
                    <ExternalLink size={15} aria-hidden="true" />
                  </a>
                ) : (
                  <p>-</p>
                )}
              </section>
            </>
          ) : (
            <div className="empty-state">
              <p>No applicants match the current filters.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
