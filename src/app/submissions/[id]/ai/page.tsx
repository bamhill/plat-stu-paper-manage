import fs from "node:fs";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getFilePath } from "@/lib/file-utils";
import { serialize } from "@/lib/utils";
import { BUILTIN_PROMPT_TEMPLATES } from "@/lib/ai-prompt-templates";
import { sanitizeForExternalModel } from "@/lib/ai-task-package";
import { PageHeader } from "@/components/layout/page-header";
import { AiTaskWorkbench } from "@/components/ai/ai-task-workbench";

export const dynamic = "force-dynamic";

export default async function SubmissionAiPage({ params }: { params: { id: string } }) {
  const teacher = await requireTeacher();
  const submissionId = Number(params.id);
  const currentSubmission = await prisma.submission.findFirst({
    where: { id: submissionId, paper: { student: { teacherId: teacher.id } } },
    include: {
      paper: {
        include: {
          student: true,
          submissions: { include: { revisions: true }, orderBy: { submissionRound: "asc" } },
          responsibilityTransfers: { include: { fromStudent: true, toStudent: true }, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!currentSubmission) notFound();

  const paper = currentSubmission.paper;
  // A submission task may use prior rounds, never later rounds.
  const visibleSubmissions = paper.submissions.filter((s) => s.submissionRound <= currentSubmission.submissionRound);
  const submissionIds = visibleSubmissions.map((s) => s.id);
  const revisionIds = visibleSubmissions.flatMap((s) => s.revisions.map((r) => r.id));
  const attachments = await prisma.attachment.findMany({
    where: {
      teacherId: teacher.id,
      OR: [
        { relatedType: { in: ["submission", "submission_paper", "submission_supplement"] }, relatedId: { in: submissionIds } },
        { relatedType: { in: ["revision", "revision_review", "revision_manuscript", "revision_supplement"] }, relatedId: { in: revisionIds } },
      ],
    },
    orderBy: { uploadedAt: "asc" },
  });
  const attachmentView = await Promise.all(attachments.map(async (a) => {
    let fileExists = false;
    try { fileExists = fs.existsSync(await getFilePath(teacher.id, a.filePath)); } catch {}
    return { ...a, fileExists };
  }));
  const customTemplates = await prisma.promptTemplate.findMany({ where: { teacherId: teacher.id }, orderBy: { updatedAt: "desc" } });
  const previousRuns = await prisma.aiTaskRun.findMany({ where: { teacherId: teacher.id, submissionId, revisionId: null }, orderBy: { createdAt: "desc" }, take: 12 });
  const settings = await getSettings(teacher.id);

  const allowTransferHistory = currentSubmission.responsibleStudentName === paper.student.name;
  const context = {
    revisionId: null,
    paperId: paper.id,
    submissionId,
    paperTitle: paper.title,
    paperShortTitle: paper.title,
    targetJournal: paper.targetVenue || "",
    currentSubmission: {
      id: currentSubmission.id,
      venueName: currentSubmission.venueName,
      submissionRound: currentSubmission.submissionRound,
      manuscriptNo: currentSubmission.manuscriptNo,
      manuscriptTitle: currentSubmission.manuscriptTitle || paper.title,
      firstAuthor: currentSubmission.firstAuthor,
      correspondingAuthor: currentSubmission.correspondingAuthor,
      responsibleStudentName: currentSubmission.responsibleStudentName,
      submittedAt: currentSubmission.submittedAt,
      decisionAt: currentSubmission.decisionAt,
      decision: currentSubmission.decision,
      editorComments: sanitizeForExternalModel(currentSubmission.editorComments),
      reviewerComments: sanitizeForExternalModel(currentSubmission.reviewerComments),
      status: currentSubmission.status,
    },
    revision: null,
    submissionHistory: visibleSubmissions.map((s) => ({
      id: s.id,
      venueName: s.venueName,
      submissionRound: s.submissionRound,
      manuscriptNo: s.manuscriptNo,
      manuscriptTitle: s.manuscriptTitle || "",
      firstAuthor: s.firstAuthor,
      correspondingAuthor: s.correspondingAuthor,
      responsibleStudentName: s.responsibleStudentName,
      submittedAt: s.submittedAt,
      decisionAt: s.decisionAt,
      decision: s.decision,
      status: s.status,
      editorComments: sanitizeForExternalModel(s.editorComments),
      reviewerComments: sanitizeForExternalModel(s.reviewerComments),
      revisions: s.revisions.map((r) => ({
        revisionRound: r.revisionRound,
        revisionType: r.revisionType,
        status: r.status,
        receivedAt: r.receivedAt,
        dueAt: r.dueAt,
        submittedAt: r.submittedAt,
        commentsSummary: sanitizeForExternalModel(r.commentsSummary),
        responseSummary: sanitizeForExternalModel(r.responseSummary),
      })),
    })),
    responsibilityTransfers: allowTransferHistory ? paper.responsibilityTransfers.map((t) => ({
      from: t.fromStudent.name,
      to: t.toStudent.name,
      transferredAt: t.transferredAt,
      notes: t.notes,
    })) : [],
    attachments: attachmentView.map((a) => ({
      id: a.id,
      relatedType: a.relatedType,
      relatedId: a.relatedId,
      fileName: a.fileName,
      fileSize: a.fileSize,
      description: a.description,
      sourceStudentName: a.sourceStudentName,
      fileExists: a.fileExists,
    })),
    aiDefaults: settings.aiPackageDefaults,
  };

  return (
    <div>
      <PageHeader title="AI辅助" description={`${paper.title} · ${currentSubmission.venueName} · 第${currentSubmission.submissionRound}次投稿`} />
      <AiTaskWorkbench context={serialize(context)} builtinTemplates={BUILTIN_PROMPT_TEMPLATES} customTemplates={serialize(customTemplates)} previousRuns={serialize(previousRuns)} />
    </div>
  );
}
