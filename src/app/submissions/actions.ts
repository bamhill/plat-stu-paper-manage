"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline";
import { syncPaperStatus } from "@/lib/paper-status";
import { submissionSchema } from "@/lib/validators";
import type { SubmissionFormData } from "@/lib/validators";

export async function createSubmission(data: SubmissionFormData) {
  const parsed = submissionSchema.parse(data);
  const paper = await prisma.paper.findUnique({ where: { id: parsed.paperId } });
  const sub = await prisma.submission.create({
    data: {
      paperId: parsed.paperId, venueName: parsed.venueName,
      submissionRound: parsed.submissionRound,
      manuscriptNo: parsed.manuscriptNo ?? null,
      submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : null,
      decisionAt: parsed.decisionAt ? new Date(parsed.decisionAt) : null,
      decision: parsed.decision ?? null,
      editorComments: parsed.editorComments ?? null,
      reviewerComments: parsed.reviewerComments ?? null,
      status: parsed.status, notes: parsed.notes ?? null,
    },
  });
  if (paper) {
    await syncPaperStatus(parsed.paperId);
    await createTimelineEvent({
      studentId: paper.studentId, relatedType: "submission", relatedId: sub.id,
      eventType: "paper_submitted", title: `投稿至 ${parsed.venueName}`,
    });
    revalidatePath(`/students/${paper.studentId}`);
    revalidatePath(`/papers/${parsed.paperId}`);
  }
  revalidatePath("/submissions");
  return sub;
}

export async function updateSubmission(id: number, data: SubmissionFormData) {
  const parsed = submissionSchema.parse(data);
  const sub = await prisma.submission.update({
    where: { id },
    data: {
      paperId: parsed.paperId, venueName: parsed.venueName,
      submissionRound: parsed.submissionRound,
      manuscriptNo: parsed.manuscriptNo ?? null,
      submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : null,
      decisionAt: parsed.decisionAt ? new Date(parsed.decisionAt) : null,
      decision: parsed.decision ?? null,
      editorComments: parsed.editorComments ?? null,
      reviewerComments: parsed.reviewerComments ?? null,
      status: parsed.status, notes: parsed.notes ?? null,
    },
  });
  await syncPaperStatus(parsed.paperId);
  if (parsed.status === "decisioned" && parsed.decision) {
    const paper = await prisma.paper.findUnique({ where: { id: parsed.paperId } });
    if (paper) {
      await createTimelineEvent({
        studentId: paper.studentId, relatedType: "submission", relatedId: sub.id,
        eventType: "decision_received", title: `${parsed.venueName} 审稿意见：${parsed.decision}`,
      });
      revalidatePath(`/students/${paper.studentId}`);
    }
  }
  revalidatePath("/submissions");
  revalidatePath(`/papers/${parsed.paperId}`);
  return sub;
}

export async function deleteSubmission(id: number) {
  const sub = await prisma.submission.findUnique({ where: { id }, include: { paper: true } });
  if (!sub) throw new Error("Submission not found");
  await prisma.submission.delete({ where: { id } });
  revalidatePath("/submissions");
  revalidatePath(`/papers/${sub.paperId}`);
}
