import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { isStudentAllowed } from "@/lib/student-policy";
import { getCurrentTeacher } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "未上传文件" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const results: string[] = [];

  const studentSheet = workbook.Sheets["学生"];
  if (studentSheet) {
    const rows = XLSX.utils.sheet_to_json<any>(studentSheet);
    for (const row of rows) {
      try {
        const studentName = String(row["姓名"] || "").trim();
        if (!isStudentAllowed(studentName)) { results.push(`学生 ${studentName} 已跳过`); continue; }
        await prisma.student.create({
          data: {
            teacherId: teacher.id,
            name: studentName, studentNo: String(row["学号"] || ""),
            degreeType: row["学位类型"] || "", enrollmentYear: Number(row["入学年份"]) || new Date().getFullYear(),
            graduationYear: row["毕业年份"] ? Number(row["毕业年份"]) : null,
            direction: row["研究方向"] || "", supervisor: row["导师"] || "",
            coSupervisor: row["副导师"] || null, status: row["状态"] || "active", notes: row["备注"] || null,
          },
        });
        results.push(`学生 ${studentName} 导入成功`);
      } catch (e: any) { results.push(`学生 ${row["姓名"]} 导入失败: ${e.message}`); }
    }
  }

  const paperSheet = workbook.Sheets["小论文"];
  if (paperSheet) {
    const rows = XLSX.utils.sheet_to_json<any>(paperSheet);
    for (const row of rows) {
      try {
        const student = await prisma.student.findFirst({ where: { teacherId: teacher.id, studentNo: String(row["学号"] || "") } });
        if (!student) { results.push(`论文 ${row["标题"]} 导入失败: 未找到学生`); continue; }
        const pType = String(row["类型(journal/conference)"] || "").toLowerCase();
        await prisma.paper.create({
          data: {
            studentId: student.id, title: row["标题"] || "",
            paperType: pType === "conference" || pType === "会议" ? "conference" : "journal",
            direction: row["方向"] || "", firstAuthor: "", correspondingAuthor: "",
            status: row["状态"] || "writing", targetVenue: row["目标期刊"] || null,
            versionLabel: row["版本标签"] || null, myThoughts: row["我的思考"] || null, notes: row["备注"] || null,
          },
        });
        results.push(`论文 ${row["标题"]} 导入成功`);
      } catch (e: any) { results.push(`论文 ${row["标题"]} 导入失败: ${e.message}`); }
    }
  }

  const subSheet = workbook.Sheets["投稿记录"];
  if (subSheet) {
    const rows = XLSX.utils.sheet_to_json<any>(subSheet);
    for (const row of rows) {
      try {
        const student = await prisma.student.findFirst({ where: { teacherId: teacher.id, studentNo: String(row["学号"] || "") } });
        if (!student) { results.push(`投稿 ${row["期刊/会议名"]} 导入失败: 未找到学生`); continue; }
        const paper = await prisma.paper.findFirst({ where: { studentId: student.id, title: row["论文标题"] || "" } });
        if (!paper) { results.push(`投稿 ${row["期刊/会议名"]} 导入失败: 未找到论文`); continue; }
        await prisma.submission.create({
          data: {
            paperId: paper.id, venueName: row["期刊/会议名"] || "", submissionRound: Number(row["轮次"]) || 1,
            manuscriptNo: row["稿件编号"] || null, manuscriptTitle: row["本轮英文题名"] || null,
            firstAuthor: row["本轮第一作者"] || null, correspondingAuthor: row["本轮通讯作者"] || null,
            submittedAt: row["投稿日期"] ? new Date(row["投稿日期"]) : null,
            underReviewAt: row["进入外审日期"] ? new Date(row["进入外审日期"]) : null,
            decisionAt: row["决定日期"] ? new Date(row["决定日期"]) : null, decision: row["决定"] || null,
            reviewerComments: row["审稿意见"] || null, editorComments: row["编辑意见"] || null,
            status: row["状态"] || "pending", notes: row["备注"] || null,
          },
        });
        results.push(`投稿 ${row["期刊/会议名"]} 导入成功`);
      } catch (e: any) { results.push(`投稿 ${row["期刊/会议名"]} 导入失败: ${e.message}`); }
    }
  }

  const revSheet = workbook.Sheets["返修记录"];
  if (revSheet) {
    const rows = XLSX.utils.sheet_to_json<any>(revSheet);
    for (const row of rows) {
      try {
        const student = await prisma.student.findFirst({ where: { teacherId: teacher.id, studentNo: String(row["学号"] || "") } });
        if (!student) { results.push("返修导入失败: 未找到学生"); continue; }
        const paper = await prisma.paper.findFirst({ where: { studentId: student.id, title: row["论文标题"] || "" } });
        if (!paper) { results.push("返修导入失败: 未找到论文"); continue; }
        const submission = await prisma.submission.findFirst({ where: { paperId: paper.id, venueName: row["期刊/会议名"] || "" }, orderBy: { submissionRound: "desc" } });
        if (!submission) { results.push("返修导入失败: 未找到投稿"); continue; }
        await prisma.revision.create({
          data: {
            submissionId: submission.id, revisionRound: Number(row["返修轮次"]) || 1,
            revisionType: row["类型(minor/major/resubmit)"] || "minor",
            receivedAt: row["收到日期"] ? new Date(row["收到日期"]) : null,
            dueAt: row["截止日期"] ? new Date(row["截止日期"]) : null,
            submittedAt: row["提交日期"] ? new Date(row["提交日期"]) : null,
            commentsSummary: row["审稿意见摘要"] || null, responseSummary: row["回复摘要"] || null,
            status: row["状态"] || "pending", notes: row["备注"] || null,
          },
        });
        results.push("返修导入成功");
      } catch (e: any) { results.push(`返修导入失败: ${e.message}`); }
    }
  }

  return NextResponse.json({ results });
}
