"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline";
import { thesisSchema, thesisReviewSchema } from "@/lib/validators";
import type { ThesisFormData, ThesisReviewFormData } from "@/lib/validators";

export async function createThesis(data: ThesisFormData) {
  const parsed = thesisSchema.parse(data);
  const thesis = await prisma.thesis.create({
    data: {
      studentId: parsed.studentId, title: parsed.title, degreeType: parsed.degreeType,
      stage: parsed.stage,
      proposalDate: parsed.proposalDate ? new Date(parsed.proposalDate) : null,
      midtermDate: parsed.midtermDate ? new Date(parsed.midtermDate) : null,
      submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : null,
      reviewedAt: parsed.reviewedAt ? new Date(parsed.reviewedAt) : null,
      defenseDate: parsed.defenseDate ? new Date(parsed.defenseDate) : null,
      score: parsed.score ?? null,
      reviewComments: parsed.reviewComments ?? null,
      revisionNotes: parsed.revisionNotes ?? null,
      status: parsed.status,
    },
  });
  revalidatePath("/theses");
  revalidatePath(`/students/${parsed.studentId}`);
  return thesis;
}

export async function updateThesis(id: number, data: ThesisFormData) {
  const parsed = thesisSchema.parse(data);
  const thesis = await prisma.thesis.update({
    where: { id },
    data: {
      title: parsed.title, degreeType: parsed.degreeType, stage: parsed.stage,
      proposalDate: parsed.proposalDate ? new Date(parsed.proposalDate) : null,
      midtermDate: parsed.midtermDate ? new Date(parsed.midtermDate) : null,
      submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : null,
      reviewedAt: parsed.reviewedAt ? new Date(parsed.reviewedAt) : null,
      defenseDate: parsed.defenseDate ? new Date(parsed.defenseDate) : null,
      score: parsed.score ?? null,
      reviewComments: parsed.reviewComments ?? null,
      revisionNotes: parsed.revisionNotes ?? null,
      status: parsed.status,
    },
  });
  revalidatePath("/theses");
  revalidatePath(`/theses/${id}`);
  revalidatePath(`/students/${parsed.studentId}`);
  return thesis;
}

export async function deleteThesis(id: number) {
  const thesis = await prisma.thesis.findUnique({ where: { id } });
  if (!thesis) throw new Error("Thesis not found");
  await prisma.thesis.delete({ where: { id } });
  revalidatePath("/theses");
  revalidatePath(`/students/${thesis.studentId}`);
}

export async function createThesisReview(data: ThesisReviewFormData) {
  const parsed = thesisReviewSchema.parse(data);
  const review = await prisma.thesisReview.create({
    data: {
      thesisId: parsed.thesisId, reviewerName: parsed.reviewerName,
      reviewerType: parsed.reviewerType, score: parsed.score ?? null,
      decision: parsed.decision, comments: parsed.comments ?? null,
      reviewedAt: parsed.reviewedAt ? new Date(parsed.reviewedAt) : null,
    },
  });
  const thesis = await prisma.thesis.findUnique({ where: { id: parsed.thesisId }, include: { student: true } });
  if (thesis) {
    await prisma.thesis.update({ where: { id: parsed.thesisId }, data: { status: "reviewed", stage: "review" } });
    await createTimelineEvent({
      studentId: thesis.studentId, relatedType: "thesis", relatedId: thesis.id,
      eventType: "thesis_reviewed", title: `大论文审稿意见：${parsed.reviewerName} (${parsed.decision})`,
      eventDate: review.reviewedAt ?? new Date(),
    });
    revalidatePath(`/students/${thesis.studentId}`);
  }
  revalidatePath(`/theses/${parsed.thesisId}`);
  return review;
}

export async function deleteThesisReview(id: number) {
  const review = await prisma.thesisReview.findUnique({ where: { id }, include: { thesis: true } });
  if (!review) throw new Error("Review not found");
  await prisma.thesisReview.delete({ where: { id } });
  revalidatePath(`/theses/${review.thesisId}`);
}
