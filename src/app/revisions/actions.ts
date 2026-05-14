"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline";
import { syncPaperStatus } from "@/lib/paper-status";
import { revisionSchema } from "@/lib/validators";
import type { RevisionFormData } from "@/lib/validators";

export async function createRevision(data: RevisionFormData) {
  const parsed = revisionSchema.parse(data);
  const submission = await prisma.submission.findUnique({ where: { id: parsed.submissionId }, include: { paper: true } });
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
  if (submission?.paper) {
    await syncPaperStatus(submission.paperId);
    await createTimelineEvent({
      studentId: submission.paper.studentId, relatedType: "revision", relatedId: rev.id,
      eventType: "revision_started", title: `${submission.venueName} 返修第${parsed.revisionRound}轮（${parsed.revisionType}）`,
      eventDate: rev.receivedAt ?? new Date(),
    });
    revalidatePath(`/students/${submission.paper.studentId}`);
  }
  revalidatePath("/revisions");
  return rev;
}

export async function updateRevision(id: number, data: RevisionFormData) {
  const parsed = revisionSchema.parse(data);
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
  revalidatePath("/revisions");
  return rev;
}

export async function deleteRevision(id: number) {
  await prisma.revision.delete({ where: { id } });
  revalidatePath("/revisions");
}
