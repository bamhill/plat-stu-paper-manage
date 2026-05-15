import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveFile, validateFile } from "@/lib/file-utils";

async function getPaperFolder(category: string, entityId: number): Promise<{ studentDir: string; subDir: string } | null> {
  try {
    if (category === "submission" || category === "submission_paper" || category === "submission_supplement") {
      const sub = await prisma.submission.findUnique({
        where: { id: entityId },
        include: { paper: { include: { student: true } } },
      });
      if (sub?.paper?.student) {
        const s = sub.paper.student;
        const studentDir = `${s.name}_${s.studentNo}`;
        const date = sub.submittedAt || new Date();
        const ym = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
        const venueAbbr = sub.venueName.replace(/[^a-zA-Z0-9一-鿿]/g, "").slice(0, 8);
        const paperTitle = sub.paper.title.replace(/[\/\\:*?"<>|\s]/g, "_").slice(0, 12);
        const subDir = `${ym}${venueAbbr}_${paperTitle}`;
        return { studentDir, subDir };
      }
    } else if (category === "revision" || category === "revision_review" || category === "revision_manuscript" || category === "revision_supplement") {
      const rev = await prisma.revision.findUnique({
        where: { id: entityId },
        include: { submission: { include: { paper: { include: { student: true } } } } },
      });
      if (rev?.submission?.paper?.student) {
        const s = rev.submission.paper.student;
        const studentDir = `${s.name}_${s.studentNo}`;
        const sub = rev.submission;
        const date = sub.submittedAt || new Date();
        const ym = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
        const venueAbbr = sub.venueName.replace(/[^a-zA-Z0-9一-鿿]/g, "").slice(0, 8);
        const paperTitle = sub.paper.title.replace(/[\/\\:*?"<>|\s]/g, "_").slice(0, 12);
        const subDir = `${ym}${venueAbbr}_${paperTitle}`;
        return { studentDir, subDir };
      }
    } else if (category === "thesis" || category === "thesis_expert" || category === "thesis_review") {
      const thesisId = category === "thesis_review"
        ? (await prisma.thesisReview.findUnique({ where: { id: entityId } }))?.thesisId
        : entityId;
      if (thesisId) {
        const thesis = await prisma.thesis.findUnique({
          where: { id: thesisId },
          include: { student: true },
        });
        if (thesis?.student) {
          const s = thesis.student;
          return { studentDir: `${s.name}_大论文`, subDir: "" };
        }
      }
    } else if (category === "papers") {
      const paper = await prisma.paper.findUnique({
        where: { id: entityId },
        include: { student: true },
      });
      if (paper?.student) {
        const s = paper.student;
        const studentDir = `${s.name}_${s.studentNo}`;
        const paperTitle = paper.title.replace(/[\/\\:*?"<>|]/g, "_").slice(0, 20);
        return { studentDir, subDir: `论文_${paperTitle}` };
      }
    }
  } catch {}
  return null;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const category = formData.get("category") as string;
  const entityId = Number(formData.get("entityId"));
  if (!file || !category || !entityId) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }
  const validation = validateFile(file);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    // Determine folder structure
    const folder = await getPaperFolder(category, entityId);
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await saveFile(
      buffer, file.name, category, entityId, file.type,
      folder?.studentDir,
      folder?.subDir,
    );
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: `上传失败: ${e.message || e}` }, { status: 500 });
  }
}
