import { prisma } from "@/lib/prisma";
import { serialize, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaperVersions } from "@/components/papers/paper-versions";
import { SubmissionTimeline } from "./submission-timeline";
import Link from "next/link";
import { paperDisplayTitle } from "@/lib/paper-display";
import { getSubmissionRuntimeMeta } from "@/lib/paper-runtime-meta";
import { getSubmissionManuscriptMetaMap } from "@/lib/submission-manuscript-meta";
import { requireTeacher } from "@/lib/auth";
import fs from "node:fs";
import { getFilePath } from "@/lib/file-utils";
import { selectCurrentSubmission } from "@/lib/submission-workflow";

export const dynamic = "force-dynamic";

export default async function PaperDetailPage({ params }: { params: { id: string } }) {
  const teacher = await requireTeacher();
  const paper = await prisma.paper.findFirst({
    where: { id: Number(params.id), student: { teacherId: teacher.id } },
    include: {
      student: true,
      versions: { orderBy: { versionNumber: "desc" } },
      submissions: { include: { revisions: true }, orderBy: [{ submittedAt: "desc" }, { id: "desc" }] },
      responsibilityTransfers: {
        include: { fromStudent: true, toStudent: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!paper) notFound();

  const subIds = paper.submissions.map((s) => s.id);
  const manuscriptMeta = getSubmissionManuscriptMetaMap(subIds);
  const submissionsWithMeta = paper.submissions.map((s) => ({ ...s, ...(manuscriptMeta.get(s.id) || {}) }));
  const rawSubAttachments = subIds.length > 0 ? await prisma.attachment.findMany({
    where: { teacherId: teacher.id, relatedType: { in: ["submission", "submission_paper", "submission_supplement"] }, relatedId: { in: subIds } },
    orderBy: { uploadedAt: "desc" },
  }) : [];
  const allSubAttachments = await Promise.all(rawSubAttachments.map(async (a) => {
    let fileExists = false;
    try { fileExists = fs.existsSync(await getFilePath(teacher.id, a.filePath)); } catch {}
    return { ...a, fileExists };
  }));

  const currentSubmission = selectCurrentSubmission(paper.submissions, paper.status);
  const latestRuntime = getSubmissionRuntimeMeta(currentSubmission?.id);
  const currentStatus = paper.status;
  const currentVenue = paper.status === "ready_to_submit"
    ? (paper.targetVenue || "未指定")
    : (currentSubmission?.venueName || paper.targetVenue || "未指定");
  const latestNode = paper.status === "ready_to_submit"
    ? `下一投 ${paper.targetVenue || "待确定"}`
    : paper.status === "accepted"
      ? `${currentSubmission?.decisionAt ? formatDate(currentSubmission.decisionAt) : ""} 已接收`.trim()
      : latestRuntime.underReviewAt
        ? `${formatDate(latestRuntime.underReviewAt as any)} 进入外审`
        : currentSubmission?.submittedAt
          ? `${formatDate(currentSubmission.submittedAt)} 投稿`
          : "暂无日期";

  return (
    <div>
      <PageHeader
        title={paperDisplayTitle(paper.title)}
        description={<>学生：<Link href={`/students/${paper.student.id}`} className="text-blue-700 hover:underline">{paper.student.name}</Link> · {paper.paperType === "journal" ? "期刊论文" : "会议论文"} · {paper.direction}</>}
        stats={[
          { label: "当前期刊 / 会议", value: <span className="text-[17px]">{currentVenue}</span> },
          { label: "当前状态", value: <span className="text-sm"><StatusBadge value={currentStatus} /></span> },
          { label: "最近节点", value: <span className="text-[13px]">{latestNode}</span>, hint: currentSubmission?.manuscriptNo ? `稿件号 ${currentSubmission.manuscriptNo}` : "" },
          { label: "稿件版本", value: paper.versionLabel || `v${paper.currentVersion}`, hint: `${paper.versions.length} 个历史版本` },
        ]}
      />

      <div className="paper-detail-grid">
        <div className="space-y-3">
          <section className="paper-detail-card">
            <div className="paper-detail-card-head"><span>基本信息</span><StatusBadge value={paper.status} /></div>
            <div className="paper-detail-card-body grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
              <div className="col-span-2"><span className="text-slate-400">当前稿件题名</span><div className="mt-0.5 font-medium leading-5 text-slate-700">{paper.title}</div></div>
              <div><span className="text-slate-400">负责学生</span><div className="mt-0.5 font-medium text-slate-700">{paper.student.name}</div></div>
              <div><span className="text-slate-400">论文类型</span><div className="mt-0.5 font-medium text-slate-700">{paper.paperType === "journal" ? "期刊" : "会议"}</div></div>
              <div><span className="text-slate-400">研究方向</span><div className="mt-0.5 font-medium text-slate-700">{paper.direction || "-"}</div></div>
              <div><span className="text-slate-400">当前目标</span><div className="mt-0.5 font-medium text-slate-700">{paper.targetVenue || "-"}</div></div>
            </div>
          </section>

          {paper.responsibilityTransfers.length > 0 && (
            <section className="paper-detail-card">
              <div className="paper-detail-card-head"><span>责任交接</span></div>
              <div className="paper-detail-card-body space-y-2">
                {paper.responsibilityTransfers.map((t) => (
                  <div key={t.id} className="text-[11px] text-slate-600">
                    <span className="font-medium text-slate-700">{t.fromStudent.name}</span>
                    <span className="mx-2 text-slate-300">→</span>
                    <span className="font-medium text-slate-700">{t.toStudent.name}</span>
                    {t.notes ? <span className="ml-2 text-slate-400">{t.notes}</span> : null}
                  </div>
                ))}
              </div>
            </section>
          )}

          {paper.myThoughts && (
            <section className="paper-detail-card">
              <div className="paper-detail-card-head"><span>导师思考</span></div>
              <div className="paper-detail-card-body text-[11px] leading-6 text-blue-900 bg-blue-50/60 whitespace-pre-wrap">{paper.myThoughts}</div>
            </section>
          )}

          <section className="paper-detail-card">
            <div className="paper-detail-card-head"><span>稿件版本</span><span className="paper-muted-note">Word / PDF 迭代</span></div>
            <div className="paper-detail-card-body"><PaperVersions paperId={paper.id} versions={serialize(paper.versions)} /></div>
          </section>
        </div>

        <section className="paper-detail-card">
          <div className="paper-detail-card-head">
            <div><span>投稿历程</span></div>
            <span className="paper-muted-note">{paper.submissions.length} 次投稿</span>
          </div>
          <div className="paper-detail-card-body">
            <SubmissionTimeline submissions={serialize(submissionsWithMeta)} subAttachments={serialize(allSubAttachments)} currentSubmissionId={currentSubmission?.id ?? null} />
          </div>
        </section>
      </div>
    </div>
  );
}
