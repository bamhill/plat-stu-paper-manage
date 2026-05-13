import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "未上传文件" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const results: string[] = [];

  // Sheet 1: 学生
  const studentSheet = workbook.Sheets["学生"];
  if (studentSheet) {
    const rows = XLSX.utils.sheet_to_json<any>(studentSheet);
    for (const row of rows) {
      try {
        await prisma.student.create({
          data: {
            name: row["姓名"] || "", studentNo: String(row["学号"] || ""),
            degreeType: row["学位类型"] || "", enrollmentYear: Number(row["入学年份"]) || new Date().getFullYear(),
            direction: row["研究方向"] || "", supervisor: row["导师"] || "",
            status: "active",
          },
        });
        results.push(`学生 ${row["姓名"]} 导入成功`);
      } catch (e: any) { results.push(`学生 ${row["姓名"]} 导入失败: ${e.message}`); }
    }
  }

  // Sheet 2: 小论文
  const paperSheet = workbook.Sheets["小论文"];
  if (paperSheet) {
    const rows = XLSX.utils.sheet_to_json<any>(paperSheet);
    for (const row of rows) {
      try {
        const student = await prisma.student.findFirst({ where: { studentNo: String(row["学号"] || "") } });
        if (!student) { results.push(`论文 ${row["标题"]} 导入失败: 未找到学生`); continue; }
        await prisma.paper.create({
          data: {
            studentId: student.id, title: row["标题"] || "",
            paperType: row["类型"] === "会议" ? "conference" : "journal",
            direction: row["方向"] || "", firstAuthor: row["第一作者"] || "",
            correspondingAuthor: row["通讯作者"] || student.supervisor,
            status: row["状态"] || "writing",
            targetVenue: row["目标期刊"] || null,
          },
        });
        results.push(`论文 ${row["标题"]} 导入成功`);
      } catch (e: any) { results.push(`论文 ${row["标题"]} 导入失败: ${e.message}`); }
    }
  }

  // Sheet 3: 投稿记录
  const subSheet = workbook.Sheets["投稿记录"];
  if (subSheet) {
    const rows = XLSX.utils.sheet_to_json<any>(subSheet);
    for (const row of rows) {
      try {
        const student = await prisma.student.findFirst({ where: { studentNo: String(row["学号"] || "") } });
        if (!student) { results.push(`投稿 ${row["期刊"]} 导入失败: 未找到学生`); continue; }
        const paper = await prisma.paper.findFirst({ where: { studentId: student.id, title: row["论文标题"] || "" } });
        if (!paper) { results.push(`投稿 ${row["期刊"]} 导入失败: 未找到论文`); continue; }
        await prisma.submission.create({
          data: {
            paperId: paper.id, venueName: row["期刊"] || "",
            submissionRound: Number(row["轮次"]) || 1,
            manuscriptNo: row["稿件编号"] || null,
            submittedAt: row["投稿日期"] ? new Date(row["投稿日期"]) : null,
            decision: row["决定"] || null,
            reviewerComments: row["审稿意见"] || null,
            status: "decisioned",
          },
        });
        results.push(`投稿 ${row["期刊"]} 导入成功`);
      } catch (e: any) { results.push(`投稿 ${row["期刊"]} 导入失败: ${e.message}`); }
    }
  }

  // Sheet 4: 返修记录
  const revSheet = workbook.Sheets["返修记录"];
  if (revSheet) {
    const rows = XLSX.utils.sheet_to_json<any>(revSheet);
    for (const row of rows) {
      try {
        const student = await prisma.student.findFirst({ where: { studentNo: String(row["学号"] || "") } });
        if (!student) { results.push(`返修 导入失败: 未找到学生`); continue; }
        const paper = await prisma.paper.findFirst({ where: { studentId: student.id, title: row["论文标题"] || "" } });
        if (!paper) { results.push(`返修 导入失败: 未找到论文`); continue; }
        const submission = await prisma.submission.findFirst({ where: { paperId: paper.id, venueName: row["期刊"] || "" } });
        if (!submission) { results.push(`返修 导入失败: 未找到投稿`); continue; }
        await prisma.revision.create({
          data: {
            submissionId: submission.id,
            revisionRound: Number(row["返修轮次"]) || 1,
            revisionType: row["类型"] || "minor",
            receivedAt: row["收到日期"] ? new Date(row["收到日期"]) : null,
            dueAt: row["截止日期"] ? new Date(row["截止日期"]) : null,
            commentsSummary: row["意见摘要"] || null,
            status: "pending",
          },
        });
        results.push(`返修 导入成功`);
      } catch (e: any) { results.push(`返修 导入失败: ${e.message}`); }
    }
  }

  return NextResponse.json({ results });
}
