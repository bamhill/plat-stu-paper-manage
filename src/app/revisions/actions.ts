"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline";
import { syncPaperStatus } from "@/lib/paper-status";
import { revisionSchema } from "@/lib/validators";
import type { RevisionFormData } from "@/lib/validators";
import { requireOwnedRevision, requireOwnedSubmission } from "@/lib/tenant";

export async function createRevision(data: RevisionFormData) {
  const parsed = revisionSchema.parse(data);
  const { submission } = await requireOwnedSubmission(parsed.submissionId);
  const rev = await prisma.revision.create({
    data: {
      submissionId: parsed.submissionId, revisionRound: parsed.revisionRound,
      receivedAt: parsed.receivedAt ? new Date(parsed.receivedAt) : null,
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
      submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : null,
      revisionType: parsed.revisionType,
      commentsSummary: parsed.commentsSummary ?? null,
      responseSummary: parsed.responseSummary ?? null,
      status: parsed.status, notes: parsed.notes ?? null,
    },
  });
  await syncPaperStatus(submission.paperId);
  await createTimelineEvent({
    studentId: submission.paper.studentId, relatedType: "revision", relatedId: rev.id,
    eventType: "revision_started", title: `${submission.venueName} 返修第${parsed.revisionRound}轮（${parsed.revisionType}）`,
    eventDate: rev.receivedAt ?? new Date(),
  });
  revalidatePath(`/students/${submission.paper.studentId}`);
  revalidatePath(`/papers/${submission.paperId}`);
  revalidatePath("/revisions");
  return rev;
}

export async function updateRevision(id: number, data: RevisionFormData) {
  const current = await requireOwnedRevision(id);
  const parsed = revisionSchema.parse(data);
  const target = await requireOwnedSubmission(parsed.submissionId);
  const rev = await prisma.revision.update({
    where: { id },
    data: {
      submissionId: parsed.submissionId, revisionRound: parsed.revisionRound,
      receivedAt: parsed.receivedAt ? new Date(parsed.receivedAt) : null,
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
      submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : null,
      revisionType: parsed.revisionType,
      commentsSummary: parsed.commentsSummary ?? null,
      responseSummary: parsed.responseSummary ?? null,
      status: parsed.status, notes: parsed.notes ?? null,
    },
  });
  await syncPaperStatus(target.submission.paperId);
  if (current.revision.submission.paperId !== target.submission.paperId) await syncPaperStatus(current.revision.submission.paperId);
  revalidatePath("/revisions");
  revalidatePath(`/papers/${target.submission.paperId}`);
  return rev;
}

export async function deleteRevision(id: number) {
  const { revision } = await requireOwnedRevision(id);
  await prisma.revision.delete({ where: { id } });
  await syncPaperStatus(revision.submission.paperId);
  revalidatePath("/revisions");
  revalidatePath(`/papers/${revision.submission.paperId}`);
}
