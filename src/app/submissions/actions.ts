"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline";
import { syncPaperStatus } from "@/lib/paper-status";
import { paperStatusFromSubmission } from "@/lib/submission-workflow";
import { submissionSchema } from "@/lib/validators";
import type { SubmissionFormData } from "@/lib/validators";
import { saveSubmissionManuscriptMeta } from "@/lib/submission-manuscript-meta";
import { requireOwnedPaper, requireOwnedSubmission } from "@/lib/tenant";

export async function createSubmission(data: SubmissionFormData) {
  const parsed = submissionSchema.parse(data);
  const { paper } = await requireOwnedPaper(parsed.paperId);
  const sub = await prisma.submission.create({
    data: {
      paperId: parsed.paperId, venueName: parsed.venueName,
      submissionRound: parsed.submissionRound,
      manuscriptNo: parsed.manuscriptNo ?? null,
      manuscriptTitle: parsed.manuscriptTitle ?? null,
      firstAuthor: parsed.firstAuthor ?? null,
      correspondingAuthor: parsed.correspondingAuthor ?? null,
      responsibleStudentName: parsed.responsibleStudentName ?? paper.student.name,
      responsibleStudentNo: parsed.responsibleStudentNo ?? paper.student.studentNo,
      submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : null,
      decisionAt: parsed.decisionAt ? new Date(parsed.decisionAt) : null,
      decision: parsed.decision ?? null,
      editorComments: parsed.editorComments ?? null,
      reviewerComments: parsed.reviewerComments ?? null,
      status: parsed.status, notes: parsed.notes ?? null,
    },
  });
  saveSubmissionManuscriptMeta(sub.id, {
    manuscriptTitle: parsed.manuscriptTitle ?? null,
    firstAuthor: parsed.firstAuthor ?? null,
    correspondingAuthor: parsed.correspondingAuthor ?? null,
  });
  // Creating a submission is an explicit workflow transition. Do not let a
  // previous `ready_to_submit` paper state suppress the newly-created round.
  const nextPaperStatus = paperStatusFromSubmission(sub, paper.status);
  if (nextPaperStatus !== paper.status) {
    await prisma.paper.update({ where: { id: parsed.paperId }, data: { status: nextPaperStatus } });
  }
  await syncPaperStatus(parsed.paperId);
  await createTimelineEvent({
    studentId: paper.studentId, relatedType: "submission", relatedId: sub.id,
    eventType: "paper_submitted", title: `投稿至 ${parsed.venueName}`,
    eventDate: sub.submittedAt ?? new Date(),
  });
  revalidatePath(`/students/${paper.studentId}`);
  revalidatePath(`/papers/${parsed.paperId}`);
  revalidatePath("/submissions");
  revalidatePath("/dashboard");
  revalidatePath("/papers");
  return sub;
}

export async function updateSubmission(id: number, data: SubmissionFormData) {
  const current = await requireOwnedSubmission(id);
  const parsed = submissionSchema.parse(data);
  const target = await requireOwnedPaper(parsed.paperId);
  const sub = await prisma.submission.update({
    where: { id },
    data: {
      paperId: parsed.paperId, venueName: parsed.venueName,
      submissionRound: parsed.submissionRound,
      manuscriptNo: parsed.manuscriptNo ?? null,
      manuscriptTitle: parsed.manuscriptTitle ?? null,
      firstAuthor: parsed.firstAuthor ?? null,
      correspondingAuthor: parsed.correspondingAuthor ?? null,
      responsibleStudentName: parsed.responsibleStudentName ?? current.submission.responsibleStudentName ?? null,
      responsibleStudentNo: parsed.responsibleStudentNo ?? current.submission.responsibleStudentNo ?? null,
      submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : null,
      decisionAt: parsed.decisionAt ? new Date(parsed.decisionAt) : null,
      decision: parsed.decision ?? null,
      editorComments: parsed.editorComments ?? null,
      reviewerComments: parsed.reviewerComments ?? null,
      status: parsed.status, notes: parsed.notes ?? null,
    },
  });
  saveSubmissionManuscriptMeta(sub.id, {
    manuscriptTitle: parsed.manuscriptTitle ?? null,
    firstAuthor: parsed.firstAuthor ?? null,
    correspondingAuthor: parsed.correspondingAuthor ?? null,
  });
  await syncPaperStatus(parsed.paperId);
  if (current.submission.paperId !== parsed.paperId) await syncPaperStatus(current.submission.paperId);
  if (parsed.status === "decisioned" && parsed.decision) {
    await createTimelineEvent({
      studentId: target.paper.studentId, relatedType: "submission", relatedId: sub.id,
      eventType: "decision_received", title: `${parsed.venueName} 审稿意见：${parsed.decision}`,
      eventDate: sub.decisionAt ?? new Date(),
    });
  }
  revalidatePath("/submissions");
  revalidatePath(`/papers/${parsed.paperId}`);
  revalidatePath(`/students/${target.paper.studentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/papers");
  return sub;
}

export async function deleteSubmission(id: number) {
  const { submission } = await requireOwnedSubmission(id);
  await prisma.submission.delete({ where: { id } });
  await syncPaperStatus(submission.paperId);
  revalidatePath("/submissions");
  revalidatePath(`/papers/${submission.paperId}`);
  revalidatePath(`/students/${submission.paper.studentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/papers");
}
