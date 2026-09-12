"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline";
import { paperSchema } from "@/lib/validators";
import type { PaperFormData } from "@/lib/validators";
import { requireTeacher } from "@/lib/auth";
import { requireOwnedPaper } from "@/lib/tenant";

export async function createPaper(data: PaperFormData) {
  const teacher = await requireTeacher();
  const parsed = paperSchema.parse(data);
  const student = await prisma.student.findFirst({ where: { id: parsed.studentId, teacherId: teacher.id }, select: { id: true } });
  if (!student) throw new Error("Student not found");
  let priorityOrder = parsed.priorityOrder ?? null;
  if (parsed.isPriority && !priorityOrder) {
    const max = await prisma.paper.aggregate({ where: { isPriority: true, student: { teacherId: teacher.id } }, _max: { priorityOrder: true } });
    priorityOrder = (max._max.priorityOrder ?? 0) + 1;
  }
  const paper = await prisma.paper.create({
    data: {
      studentId: parsed.studentId, title: parsed.title,
      paperType: parsed.paperType, direction: parsed.direction,
      firstAuthor: "", correspondingAuthor: "",
      status: parsed.status, targetVenue: parsed.targetVenue ?? null,
      notes: parsed.notes ?? null, myThoughts: parsed.myThoughts ?? null,
      currentVersion: 1, versionLabel: parsed.versionLabel ?? null,
      isPriority: parsed.isPriority ?? false, priorityOrder: parsed.isPriority ? priorityOrder : null,
    },
  });
  await createTimelineEvent({
    studentId: parsed.studentId, relatedType: "paper", relatedId: paper.id,
    eventType: "paper_created", title: `创建小论文：${paper.title}`,
  });
  revalidatePath("/papers");
  revalidatePath(`/students/${parsed.studentId}`);
  return paper;
}

export async function updatePaper(id: number, data: PaperFormData) {
  const { teacher, paper: oldPaper } = await requireOwnedPaper(id);
  const parsed = paperSchema.parse(data);
  const targetStudent = await prisma.student.findFirst({ where: { id: parsed.studentId, teacherId: teacher.id } });
  if (!targetStudent) throw new Error("Student not found");
  let priorityOrder = parsed.priorityOrder ?? null;
  if (parsed.isPriority && !priorityOrder) {
    const max = await prisma.paper.aggregate({ where: { isPriority: true, student: { teacherId: teacher.id }, id: { not: id } }, _max: { priorityOrder: true } });
    priorityOrder = (max._max.priorityOrder ?? 0) + 1;
  }
  const paper = await prisma.paper.update({
    where: { id },
    data: {
      studentId: parsed.studentId, title: parsed.title,
      paperType: parsed.paperType, direction: parsed.direction,
      status: parsed.status, targetVenue: parsed.targetVenue ?? null,
      notes: parsed.notes ?? null, myThoughts: parsed.myThoughts ?? null,
      versionLabel: parsed.versionLabel ?? null,
      isPriority: parsed.isPriority ?? false, priorityOrder: parsed.isPriority ? priorityOrder : null,
    },
  });
  revalidatePath("/papers");
  revalidatePath(`/papers/${id}`);
  revalidatePath(`/students/${parsed.studentId}`);
  if (oldPaper.studentId !== parsed.studentId) revalidatePath(`/students/${oldPaper.studentId}`);
  return paper;
}

export async function deletePaper(id: number) {
  const { paper } = await requireOwnedPaper(id);
  await prisma.paper.delete({ where: { id } });
  revalidatePath("/papers");
  revalidatePath(`/students/${paper.studentId}`);
}

export async function addPaperVersion(paperId: number, fileName: string, filePath: string, fileSize: number, description?: string) {
  const { paper } = await requireOwnedPaper(paperId);
  const newVersion = paper.currentVersion + 1;
  const version = await prisma.paperVersion.create({
    data: { paperId, versionNumber: newVersion, fileName, filePath, fileSize, description: description ?? null },
  });
  await prisma.paper.update({ where: { id: paperId }, data: { currentVersion: newVersion } });
  revalidatePath(`/papers/${paperId}`);
  return version;
}
