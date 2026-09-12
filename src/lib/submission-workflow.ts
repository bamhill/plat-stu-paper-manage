export const ACTIVE_SUBMISSION_STATUSES = new Set([
  "submitted", "with_editor", "awaiting_reviewer_assignment", "under_review", "pending",
]);

export type SubmissionLike = {
  id: number; status: string; decision?: string | null; submittedAt?: Date | string | number | null;
  underReviewAt?: Date | string | number | null; decisionAt?: Date | string | number | null;
  createdAt?: Date | string | number | null; updatedAt?: Date | string | number | null;
};

function ts(v: unknown): number {
  if (!v) return 0;
  const d = v instanceof Date ? v : new Date(v as any);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export function submissionEventTime(s: SubmissionLike): number {
  return Math.max(ts(s.decisionAt), ts(s.underReviewAt), ts(s.submittedAt), ts(s.updatedAt), ts(s.createdAt), Number(s.id) || 0);
}

export function isActiveSubmission(s: SubmissionLike): boolean {
  return !s.decision && ACTIVE_SUBMISSION_STATUSES.has(s.status);
}

export function selectCurrentSubmission<T extends SubmissionLike>(submissions: T[], paperStatus?: string | null): T | null {
  if (!submissions.length) return null;
  if (paperStatus === "writing" || paperStatus === "ready_to_submit") return null;
  const sorted = [...submissions].sort((a,b)=>submissionEventTime(b)-submissionEventTime(a));
  if (paperStatus === "accepted" || paperStatus === "published") {
    return sorted.find((s)=>s.decision === "accept") ?? sorted[0];
  }
  if (paperStatus === "rejected") {
    return sorted.find((s)=>s.decision === "reject") ?? sorted[0];
  }
  const active = sorted.find(isActiveSubmission);
  if (active) return active;
  return sorted[0];
}

export function paperStatusFromSubmission(s: SubmissionLike | null, fallback: string): string {
  if (!s) return fallback;
  if (s.decision === "accept") return "accepted";
  if (s.decision === "reject") return "rejected";
  if (s.decision === "minor_revision") return "minor_revision";
  if (s.decision === "major_revision") return "major_revision";
  if (s.status === "under_review") return "under_review";
  if (s.status === "awaiting_reviewer_assignment") return "awaiting_reviewer_assignment";
  if (s.status === "with_editor" || s.status === "pending") return "with_editor";
  if (s.status === "submitted") return "submitted";
  return fallback;
}
