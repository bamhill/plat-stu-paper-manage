import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export async function requireOwnedStudent(id: number) {
  const teacher = await requireTeacher();
  const student = await prisma.student.findFirst({ where: { id, teacherId: teacher.id } });
  if (!student) throw new Error("Student not found");
  return { teacher, student };
}

export async function requireOwnedPaper(id: number) {
  const teacher = await requireTeacher();
  const paper = await prisma.paper.findFirst({
    where: { id, student: { teacherId: teacher.id } },
    include: { student: true },
  });
  if (!paper) throw new Error("Paper not found");
  return { teacher, paper };
}

export async function requireOwnedSubmission(id: number) {
  const teacher = await requireTeacher();
  const submission = await prisma.submission.findFirst({
    where: { id, paper: { student: { teacherId: teacher.id } } },
    include: { paper: { include: { student: true } } },
  });
  if (!submission) throw new Error("Submission not found");
  return { teacher, submission };
}

export async function requireOwnedRevision(id: number) {
  const teacher = await requireTeacher();
  const revision = await prisma.revision.findFirst({
    where: { id, submission: { paper: { student: { teacherId: teacher.id } } } },
    include: { submission: { include: { paper: { include: { student: true } } } } },
  });
  if (!revision) throw new Error("Revision not found");
  return { teacher, revision };
}

export async function requireOwnedThesis(id: number) {
  const teacher = await requireTeacher();
  const thesis = await prisma.thesis.findFirst({
    where: { id, student: { teacherId: teacher.id } },
    include: { student: true },
  });
  if (!thesis) throw new Error("Thesis not found");
  return { teacher, thesis };
}

export async function requireOwnedThesisReview(id: number) {
  const teacher = await requireTeacher();
  const review = await prisma.thesisReview.findFirst({
    where: { id, thesis: { student: { teacherId: teacher.id } } },
    include: { thesis: { include: { student: true } } },
  });
  if (!review) throw new Error("Thesis review not found");
  return { teacher, review };
}

export async function assertOwnedRelated(relatedType: string, relatedId: number) {
  if (["paper", "papers"].includes(relatedType)) return requireOwnedPaper(relatedId);
  if (["submission", "submission_paper", "submission_supplement"].includes(relatedType)) return requireOwnedSubmission(relatedId);
  if (["revision", "revision_review", "revision_manuscript", "revision_supplement"].includes(relatedType)) return requireOwnedRevision(relatedId);
  if (["thesis", "thesis_expert"].includes(relatedType)) return requireOwnedThesis(relatedId);
  if (relatedType === "thesis_review") return requireOwnedThesisReview(relatedId);
  throw new Error("Unsupported related type");
}
