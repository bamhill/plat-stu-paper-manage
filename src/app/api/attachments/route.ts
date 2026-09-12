import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacher } from "@/lib/auth";
import { assertOwnedRelated } from "@/lib/tenant";
import { getFilePath } from "@/lib/file-utils";

function unauthorized() { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

async function sourceSnapshot(teacherId: number, relatedType: string, relatedId: number): Promise<{ sourceStudentName?: string; sourceStudentNo?: string }> {
  if (["submission", "submission_paper", "submission_supplement"].includes(relatedType)) {
    const sub = await prisma.submission.findFirst({
      where: { id: relatedId, paper: { student: { teacherId } } },
      include: { paper: { include: { student: true } } },
    });
    if (!sub) return {};
    return {
      sourceStudentName: sub.responsibleStudentName || sub.paper.student.name,
      sourceStudentNo: sub.responsibleStudentNo || sub.paper.student.studentNo,
    };
  }
  if (["revision", "revision_review", "revision_manuscript", "revision_supplement"].includes(relatedType)) {
    const rev = await prisma.revision.findFirst({
      where: { id: relatedId, submission: { paper: { student: { teacherId } } } },
      include: { submission: { include: { paper: { include: { student: true } } } } },
    });
    if (!rev) return {};
    const sub = rev.submission;
    return {
      sourceStudentName: sub.responsibleStudentName || sub.paper.student.name,
      sourceStudentNo: sub.responsibleStudentNo || sub.paper.student.studentNo,
    };
  }
  if (["thesis", "thesis_expert", "thesis_review"].includes(relatedType)) {
    const thesisId = relatedType === "thesis_review"
      ? (await prisma.thesisReview.findFirst({ where: { id: relatedId, thesis: { student: { teacherId } } } }))?.thesisId
      : relatedId;
    if (!thesisId) return {};
    const thesis = await prisma.thesis.findFirst({ where: { id: thesisId, student: { teacherId } }, include: { student: true } });
    return thesis ? { sourceStudentName: thesis.student.name, sourceStudentNo: thesis.student.studentNo } : {};
  }
  if (["paper", "papers"].includes(relatedType)) {
    const paper = await prisma.paper.findFirst({ where: { id: relatedId, student: { teacherId } }, include: { student: true } });
    return paper ? { sourceStudentName: paper.student.name, sourceStudentNo: paper.student.studentNo } : {};
  }
  return {};
}

export async function GET(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return unauthorized();
  const { searchParams } = new URL(req.url);
  const relatedType = searchParams.get("relatedType");
  const relatedId = searchParams.get("relatedId");
  if (!relatedType || !relatedId) return NextResponse.json([]);
  try { await assertOwnedRelated(relatedType, Number(relatedId)); } catch { return NextResponse.json([], { status: 200 }); }
  const attachments = await prisma.attachment.findMany({
    where: { teacherId: teacher.id, relatedType, relatedId: Number(relatedId) },
    orderBy: { uploadedAt: "desc" },
  });
  const rows = await Promise.all(attachments.map(async (a) => {
    let fileExists = false;
    try { fileExists = fs.existsSync(await getFilePath(teacher.id, a.filePath)); } catch {}
    return { ...a, fileExists };
  }));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return unauthorized();
  const body = await req.json();
  const { relatedType, relatedId, fileName, filePath, fileType, fileSize, description } = body;
  if (!relatedType || !relatedId || !fileName || !filePath) return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  try { await assertOwnedRelated(relatedType, Number(relatedId)); }
  catch { return NextResponse.json({ error: "记录不存在" }, { status: 404 }); }
  const source = await sourceSnapshot(teacher.id, relatedType, Number(relatedId));

  const attachment = await prisma.attachment.create({
    data: {
      teacherId: teacher.id, relatedType, relatedId: Number(relatedId), fileName, filePath,
      fileType: fileType || "application/octet-stream", fileSize: fileSize || 0, description: description || null,
      sourceStudentName: source.sourceStudentName || null,
      sourceStudentNo: source.sourceStudentNo || null,
    },
  });
  return NextResponse.json({ ...attachment, fileExists: true });
}

export async function DELETE(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return unauthorized();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少id" }, { status: 400 });
  const attachment = await prisma.attachment.findFirst({ where: { id: Number(id), teacherId: teacher.id } });
  if (!attachment) return NextResponse.json({ error: "附件不存在" }, { status: 404 });
  const fsPromises = await import("fs/promises");
  try { await fsPromises.unlink(await getFilePath(teacher.id, attachment.filePath)); } catch {}
  await prisma.attachment.delete({ where: { id: attachment.id } });
  return NextResponse.json({ ok: true });
}
