import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveFile, validateFile } from "@/lib/file-utils";
import { getCurrentTeacher } from "@/lib/auth";

async function getPaperFolder(category: string, entityId: number, teacherId: number): Promise<{ studentDir: string; subDir: string } | null> {
  try {
    if (["submission", "submission_paper", "submission_supplement"].includes(category)) {
      const sub = await prisma.submission.findFirst({
        where: { id: entityId, paper: { student: { teacherId } } },
        include: { paper: { include: { student: true } } },
      });
      if (sub?.paper?.student) {
        const s = {
          name: sub.responsibleStudentName || sub.paper.student.name,
          studentNo: sub.responsibleStudentNo || sub.paper.student.studentNo,
        };
        const studentDir = `${s.name}_${s.studentNo}`;
        const date = sub.submittedAt || new Date();
        const ym = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
        const venueAbbr = sub.venueName.replace(/[^a-zA-Z0-9一-鿿]/g, "").slice(0, 8);
        const paperTitle = sub.paper.title.replace(/[\/\\:*?"<>|\s]/g, "_").slice(0, 12);
        return { studentDir, subDir: `${ym}${venueAbbr}_${paperTitle}` };
      }
    } else if (["revision", "revision_review", "revision_manuscript", "revision_supplement"].includes(category)) {
      const rev = await prisma.revision.findFirst({
        where: { id: entityId, submission: { paper: { student: { teacherId } } } },
        include: { submission: { include: { paper: { include: { student: true } } } } },
      });
      if (rev?.submission?.paper?.student) {
        const s = {
          name: rev.submission.responsibleStudentName || rev.submission.paper.student.name,
          studentNo: rev.submission.responsibleStudentNo || rev.submission.paper.student.studentNo,
        };
        const studentDir = `${s.name}_${s.studentNo}`;
        const sub = rev.submission;
        const date = sub.submittedAt || new Date();
        const ym = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
        const venueAbbr = sub.venueName.replace(/[^a-zA-Z0-9一-鿿]/g, "").slice(0, 8);
        const paperTitle = sub.paper.title.replace(/[\/\\:*?"<>|\s]/g, "_").slice(0, 12);
        return { studentDir, subDir: `${ym}${venueAbbr}_${paperTitle}` };
      }
    } else if (["thesis", "thesis_expert", "thesis_review"].includes(category)) {
      const thesisId = category === "thesis_review"
        ? (await prisma.thesisReview.findFirst({ where: { id: entityId, thesis: { student: { teacherId } } } }))?.thesisId
        : entityId;
      if (thesisId) {
        const thesis = await prisma.thesis.findFirst({ where: { id: thesisId, student: { teacherId } }, include: { student: true } });
        if (thesis?.student) return { studentDir: `${thesis.student.name}_大论文`, subDir: "" };
      }
    } else if (category === "papers") {
      const paper = await prisma.paper.findFirst({ where: { id: entityId, student: { teacherId } }, include: { student: true } });
      if (paper?.student) {
        const studentDir = `${paper.student.name}_${paper.student.studentNo}`;
        const paperTitle = paper.title.replace(/[\/\\:*?"<>|]/g, "_").slice(0, 20);
        return { studentDir, subDir: `论文_${paperTitle}` };
      }
    }
  } catch {}
  return null;
}

export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const category = formData.get("category") as string;
  const entityId = Number(formData.get("entityId"));
  if (!file || !category || !entityId) return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  const validation = validateFile(file);
  if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });

  try {
    const folder = await getPaperFolder(category, entityId, teacher.id);
    if (!folder) return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await saveFile(teacher.id, buffer, file.name, category, entityId, file.type, folder.studentDir, folder.subDir);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: `上传失败: ${e.message || e}` }, { status: 500 });
  }
}
