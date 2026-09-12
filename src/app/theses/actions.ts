"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline";
import { thesisSchema, thesisReviewSchema } from "@/lib/validators";
import type { ThesisFormData, ThesisReviewFormData } from "@/lib/validators";
import { requireTeacher } from "@/lib/auth";
import { requireOwnedThesis, requireOwnedThesisReview } from "@/lib/tenant";

async function requireTeacherStudent(studentId: number) {
  const teacher = await requireTeacher();
  const student = await prisma.student.findFirst({ where: { id: studentId, teacherId: teacher.id } });
  if (!student) throw new Error("Student not found");
  return { teacher, student };
}

export async function createThesis(data: ThesisFormData) {
  const parsed = thesisSchema.parse(data);
  await requireTeacherStudent(parsed.studentId);
  const thesis = await prisma.thesis.create({
    data: {
      studentId: parsed.studentId, title: parsed.title, degreeType: parsed.degreeType,
      stage: parsed.stage,
      proposalDate: parsed.proposalDate ? new Date(parsed.proposalDate) : null,
      defenseDate: parsed.defenseDate ? new Date(parsed.defenseDate) : null,
      score: parsed.score ?? null,
      expert1Score: parsed.expert1Score ?? null,
      expert2Score: parsed.expert2Score ?? null,
      expert3Score: parsed.expert3Score ?? null,
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
  const { thesis: oldThesis } = await requireOwnedThesis(id);
  const parsed = thesisSchema.parse(data);
  await requireTeacherStudent(parsed.studentId);
  const thesis = await prisma.thesis.update({
    where: { id },
    data: {
      studentId: parsed.studentId, title: parsed.title, degreeType: parsed.degreeType, stage: parsed.stage,
      proposalDate: parsed.proposalDate ? new Date(parsed.proposalDate) : null,
      defenseDate: parsed.defenseDate ? new Date(parsed.defenseDate) : null,
      score: parsed.score ?? null,
      expert1Score: parsed.expert1Score ?? null,
      expert2Score: parsed.expert2Score ?? null,
      expert3Score: parsed.expert3Score ?? null,
      reviewComments: parsed.reviewComments ?? null,
      revisionNotes: parsed.revisionNotes ?? null,
      status: parsed.status,
    },
  });
  revalidatePath("/theses");
  revalidatePath(`/theses/${id}`);
  revalidatePath(`/students/${parsed.studentId}`);
  if (oldThesis.studentId !== parsed.studentId) revalidatePath(`/students/${oldThesis.studentId}`);
  return thesis;
}

export async function deleteThesis(id: number) {
  const { thesis } = await requireOwnedThesis(id);
  await prisma.thesis.delete({ where: { id } });
  revalidatePath("/theses");
  revalidatePath(`/students/${thesis.studentId}`);
}

export async function createThesisReview(data: ThesisReviewFormData) {
  const parsed = thesisReviewSchema.parse(data);
  const { thesis } = await requireOwnedThesis(parsed.thesisId);
  const review = await prisma.thesisReview.create({
    data: {
      thesisId: parsed.thesisId, reviewerName: parsed.reviewerName,
      reviewerType: parsed.reviewerType, score: parsed.score ?? null,
      decision: parsed.decision, comments: parsed.comments ?? null,
      reviewedAt: parsed.reviewedAt ? new Date(parsed.reviewedAt) : null,
    },
  });
  await prisma.thesis.update({ where: { id: parsed.thesisId }, data: { status: "reviewed", stage: "review" } });
  await createTimelineEvent({
    studentId: thesis.studentId, relatedType: "thesis", relatedId: thesis.id,
    eventType: "thesis_reviewed", title: `大论文审稿意见：${parsed.reviewerName} (${parsed.decision})`,
    eventDate: review.reviewedAt ?? new Date(),
  });
  revalidatePath(`/students/${thesis.studentId}`);
  revalidatePath(`/theses/${parsed.thesisId}`);
  return review;
}

export async function updateThesisReview(id: number, data: ThesisReviewFormData) {
  const current = await requireOwnedThesisReview(id);
  const parsed = thesisReviewSchema.parse(data);
  await requireOwnedThesis(parsed.thesisId);
  const review = await prisma.thesisReview.update({
    where: { id },
    data: {
      thesisId: parsed.thesisId, reviewerName: parsed.reviewerName, reviewerType: parsed.reviewerType,
      score: parsed.score ?? null, decision: parsed.decision,
      comments: parsed.comments ?? null,
      reviewedAt: parsed.reviewedAt ? new Date(parsed.reviewedAt) : null,
    },
  });
  revalidatePath(`/theses/${review.thesisId}`);
  if (current.review.thesisId !== review.thesisId) revalidatePath(`/theses/${current.review.thesisId}`);
  return review;
}

export async function deleteThesisReview(id: number) {
  const { review } = await requireOwnedThesisReview(id);
  await prisma.thesisReview.delete({ where: { id } });
  revalidatePath(`/theses/${review.thesisId}`);
}
