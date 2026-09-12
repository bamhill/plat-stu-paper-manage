import path from "node:path";
import { DatabaseSync } from "node:sqlite";

function openDb() {
  return new DatabaseSync(path.join(process.cwd(), "prisma", "data", "dev.db"), { readOnly: true });
}

export function getPaperPriorityMeta() {
  const db = openDb();
  try {
    const rows = db.prepare(`SELECT id, COALESCE(is_priority,0) AS is_priority, priority_order FROM papers`).all() as Array<{ id: number; is_priority: number; priority_order: number | null }>;
    return new Map(rows.map((r) => [Number(r.id), { isPriority: !!r.is_priority, priorityOrder: r.priority_order == null ? null : Number(r.priority_order) }]));
  } finally {
    db.close();
  }
}

export function getSubmissionRuntimeMeta(submissionId: number | undefined | null) {
  if (!submissionId) return { underReviewAt: null as number | string | Date | null };
  const db = openDb();
  try {
    const row = db.prepare(`SELECT under_review_at FROM submissions WHERE id = ?`).get(submissionId) as { under_review_at?: number | string | null } | undefined;
    return { underReviewAt: row?.under_review_at ?? null };
  } finally {
    db.close();
  }
}
