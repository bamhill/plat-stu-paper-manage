import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacher } from "@/lib/auth";
import { requireOwnedRevision, requireOwnedSubmission } from "@/lib/tenant";
import { parseModelAssistResult, validateAcceptedItems } from "@/lib/model-assist.mjs";

async function requireRunContext(teacherId: number, runId: number) {
  const run = await prisma.aiTaskRun.findFirst({ where: { id: runId, teacherId } });
  if (!run) return null;
  try {
    if (run.revisionId) await requireOwnedRevision(run.revisionId);
    else if (run.submissionId) await requireOwnedSubmission(run.submissionId);
    else return null;
  } catch {
    return null;
  }
  return run;
}

export async function GET(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const revisionId = Number(url.searchParams.get("revisionId"));
  const submissionId = Number(url.searchParams.get("submissionId"));
  if (revisionId) {
    try { await requireOwnedRevision(revisionId); } catch { return NextResponse.json([]); }
    return NextResponse.json(await prisma.aiTaskRun.findMany({ where: { teacherId: teacher.id, revisionId }, orderBy: { createdAt: "desc" }, take: 20 }));
  }
  if (submissionId) {
    try { await requireOwnedSubmission(submissionId); } catch { return NextResponse.json([]); }
    return NextResponse.json(await prisma.aiTaskRun.findMany({ where: { teacherId: teacher.id, submissionId, revisionId: null }, orderBy: { createdAt: "desc" }, take: 20 }));
  }
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const revisionId = Number(body.revisionId) || null;
  const submissionId = Number(body.submissionId) || null;
  let paperId: number;
  let ownedSubmissionId: number;

  if (revisionId) {
    let owned;
    try { owned = await requireOwnedRevision(revisionId); }
    catch { return NextResponse.json({ error: "返修记录不存在" }, { status: 404 }); }
    paperId = owned.revision.submission.paperId;
    ownedSubmissionId = owned.revision.submissionId;
  } else if (submissionId) {
    let owned;
    try { owned = await requireOwnedSubmission(submissionId); }
    catch { return NextResponse.json({ error: "投稿记录不存在" }, { status: 404 }); }
    paperId = owned.submission.paperId;
    ownedSubmissionId = owned.submission.id;
  } else {
    return NextResponse.json({ error: "缺少投稿或返修记录" }, { status: 400 });
  }

  const promptText = String(body.promptText || "").trim();
  const packageText = String(body.packageText || "").trim();
  if (!promptText || !packageText) return NextResponse.json({ error: "提示词和任务包不能为空" }, { status: 400 });

  const rawResult = String(body.rawResult ?? body.resultText ?? "");
  const parsed = parseModelAssistResult(rawResult);
  const material = body.materialJson && typeof body.materialJson === "object" ? body.materialJson : {};
  const hasResult = rawResult.trim().length > 0;

  const row = await prisma.aiTaskRun.create({
    data: {
      teacherId: teacher.id,
      paperId,
      submissionId: ownedSubmissionId,
      revisionId,
      taskType: String(body.taskType || "reviewer_analysis"),
      templateKey: body.templateKey ? String(body.templateKey) : null,
      templateName: body.templateName ? String(body.templateName) : null,
      promptText,
      packageText,
      supplementalText: body.supplementalText ? String(body.supplementalText) : null,
      resultText: hasResult ? rawResult : null,
      rawResult: hasResult ? rawResult : null,
      parsedJson: hasResult ? JSON.stringify(parsed) : null,
      acceptedJson: "[]",
      materialJson: JSON.stringify(material),
      parseWarningsJson: hasResult ? JSON.stringify(parsed.warnings) : "[]",
      parsedAt: hasResult ? new Date() : null,
      acceptedAt: null,
      resultStatus: "draft",
    },
  });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const runId = Number(body.runId);
  if (!runId) return NextResponse.json({ error: "缺少结果记录" }, { status: 400 });
  const run = await requireRunContext(teacher.id, runId);
  if (!run) return NextResponse.json({ error: "结果记录不存在" }, { status: 404 });
  if (run.acceptedAt) return NextResponse.json({ error: "已采用记录不可再次改写" }, { status: 409 });

  const action = String(body.action || "parse");
  const rawResult = String(run.rawResult ?? run.resultText ?? "");
  if (body.rawResult != null && String(body.rawResult) !== rawResult) {
    return NextResponse.json({ error: "原始模型结果已保存，不允许在采用阶段改写；请另存为新的结果记录" }, { status: 409 });
  }
  const parsed = parseModelAssistResult(rawResult);

  if (action === "parse") {
    const updated = await prisma.aiTaskRun.update({
      where: { id: run.id },
      data: {
        resultText: rawResult || null,
        rawResult: rawResult || null,
        parsedJson: JSON.stringify(parsed),
        parseWarningsJson: JSON.stringify(parsed.warnings),
        parsedAt: new Date(),
        acceptedJson: "[]",
        resultStatus: "draft",
      },
    });
    return NextResponse.json(updated);
  }

  if (action === "adopt") {
    let validated;
    try { validated = validateAcceptedItems(parsed, body.items); }
    catch (error) {
      if (String(error).includes("SOURCE_PROTECTED")) return NextResponse.json({ error: "SOURCE 为来源事实，采用时不能修改" }, { status: 400 });
      throw error;
    }
    if (!validated.accepted.length) return NextResponse.json({ error: "请至少勾选一个工作项" }, { status: 400 });
    const acceptedPayload = {
      parserVersion: parsed.parserVersion,
      items: validated.accepted,
      warnings: [...parsed.warnings, ...validated.warnings],
    };
    const updated = await prisma.aiTaskRun.update({
      where: { id: run.id },
      data: {
        resultText: rawResult || null,
        rawResult: rawResult || null,
        parsedJson: JSON.stringify(parsed),
        parseWarningsJson: JSON.stringify(parsed.warnings),
        parsedAt: run.parsedAt || new Date(),
        acceptedJson: JSON.stringify(acceptedPayload),
        acceptedAt: new Date(),
        resultStatus: "confirmed",
      },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
