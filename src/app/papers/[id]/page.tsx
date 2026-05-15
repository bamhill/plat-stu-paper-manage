import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaperVersions } from "@/components/papers/paper-versions";
import { AttachmentUpload } from "@/components/shared/attachment-upload";
import { SubmissionTimeline } from "./submission-timeline";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PaperDetailPage({ params }: { params: { id: string } }) {
  const paper = await prisma.paper.findUnique({
    where: { id: Number(params.id) },
    include: {
      student: true,
      versions: { orderBy: { versionNumber: "desc" } },
      submissions: { include: { revisions: true }, orderBy: { submissionRound: "desc" } },
    },
  });
  if (!paper) notFound();

  const paperAttachments = await prisma.attachment.findMany({
    where: { relatedType: "paper", relatedId: Number(params.id) },
    orderBy: { uploadedAt: "desc" },
  });

  // Fetch attachments for each submission
  const subIds = paper.submissions.map(s => s.id);
  const allSubAttachments = subIds.length > 0 ? await prisma.attachment.findMany({
    where: {
      relatedType: { in: ["submission", "submission_paper", "submission_supplement"] },
      relatedId: { in: subIds },
    },
    orderBy: { uploadedAt: "desc" },
  }) : [];

  return (
    <div>
      <AppBreadcrumb />
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold">{paper.title}</h1>
          <StatusBadge value={paper.status} />
        </div>
        <p className="text-gray-500 text-sm">
          学生：<Link href={`/students/${paper.student.id}`} className="text-blue-600 hover:underline">{paper.student.name}</Link>
          {" · "}类型：{paper.paperType === "journal" ? "期刊" : "会议"}
          {" · "}目标：{paper.targetVenue ?? "未指定"}
          {" · "}版本：{paper.versionLabel || `v${paper.currentVersion}`}
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Info + Versions + Attachments */}
        <div className="lg:col-span-2 space-y-4 bg-gray-50/50 -m-3 p-3 rounded-lg">
          <div className="rounded-lg border bg-white p-3">
            <h2 className="font-medium text-sm mb-2">基本信息</h2>
            <div className="grid grid-cols-1 gap-1 text-xs">
              <div><span className="text-gray-500">第一作者：</span>{paper.firstAuthor}</div>
              <div><span className="text-gray-500">通讯作者：</span>{paper.correspondingAuthor}</div>
              <div><span className="text-gray-500">方向：</span>{paper.direction}</div>
            </div>
          </div>
          {paper.myThoughts && (
            <div className="rounded-lg border bg-blue-50 p-3">
              <h2 className="font-medium text-sm mb-1 text-blue-900">我的思考</h2>
              <p className="text-xs text-blue-800 whitespace-pre-wrap">{paper.myThoughts}</p>
            </div>
          )}
          <div className="rounded-lg border bg-white p-3">
            <PaperVersions paperId={paper.id} versions={JSON.parse(JSON.stringify(paper.versions))} />
          </div>
          <div className="rounded-lg border bg-white p-3">
            <h2 className="font-medium text-sm mb-2">附件</h2>
            <AttachmentUpload
              relatedType="paper"
              relatedId={paper.id}
              existingAttachments={JSON.parse(JSON.stringify(paperAttachments)).map((a: any) => ({
                id: a.id, fileName: a.fileName, filePath: a.filePath,
                fileSize: a.fileSize, fileType: a.fileType,
                description: a.description, uploadedAt: a.uploadedAt,
              }))}
            />
          </div>
        </div>

        {/* Right: Submission Timeline */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="font-medium">投稿历程</h2>
          <SubmissionTimeline
            submissions={JSON.parse(JSON.stringify(paper.submissions))}
            subAttachments={JSON.parse(JSON.stringify(allSubAttachments))}
          />
        </div>
      </div>
    </div>
  );
}
