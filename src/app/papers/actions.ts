"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline";
import { paperSchema } from "@/lib/validators";
import type { PaperFormData } from "@/lib/validators";

export async function createPaper(data: PaperFormData) {
  const parsed = paperSchema.parse(data);
  const paper = await prisma.paper.create({
    data: {
      studentId: parsed.studentId, title: parsed.title,
      paperType: parsed.paperType, direction: parsed.direction,
      firstAuthor: parsed.firstAuthor, correspondingAuthor: parsed.correspondingAuthor,
      status: parsed.status, targetVenue: parsed.targetVenue ?? null,
      notes: parsed.notes ?? null, myThoughts: parsed.myThoughts ?? null,
      currentVersion: 1,
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
  const parsed = paperSchema.parse(data);
  const paper = await prisma.paper.update({
    where: { id },
    data: {
      studentId: parsed.studentId, title: parsed.title,
      paperType: parsed.paperType, direction: parsed.direction,
      firstAuthor: parsed.firstAuthor, correspondingAuthor: parsed.correspondingAuthor,
      status: parsed.status, targetVenue: parsed.targetVenue ?? null,
      notes: parsed.notes ?? null, myThoughts: parsed.myThoughts ?? null,
    },
  });
  revalidatePath("/papers");
  revalidatePath(`/papers/${id}`);
  revalidatePath(`/students/${parsed.studentId}`);
  return paper;
}

export async function deletePaper(id: number) {
  const paper = await prisma.paper.findUnique({ where: { id } });
  if (!paper) throw new Error("Paper not found");
  await prisma.paper.delete({ where: { id } });
  revalidatePath("/papers");
  revalidatePath(`/students/${paper.studentId}`);
}

export async function addPaperVersion(paperId: number, fileName: string, filePath: string, fileSize: number, description?: string) {
  const paper = await prisma.paper.findUnique({ where: { id: paperId } });
  if (!paper) throw new Error("Paper not found");
  const newVersion = paper.currentVersion + 1;
  const version = await prisma.paperVersion.create({
    data: { paperId, versionNumber: newVersion, fileName, filePath, fileSize, description: description ?? null },
  });
  await prisma.paper.update({ where: { id: paperId }, data: { currentVersion: newVersion } });
  revalidatePath(`/papers/${paperId}`);
  return version;
}
