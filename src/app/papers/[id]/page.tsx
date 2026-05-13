import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaperVersions } from "@/components/papers/paper-versions";
import { AttachmentUpload } from "@/components/shared/attachment-upload";
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
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-white p-4">
            <h2 className="font-medium mb-2">基本信息</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">第一作者：</span>{paper.firstAuthor}</div>
              <div><span className="text-gray-500">通讯作者：</span>{paper.correspondingAuthor}</div>
              <div><span className="text-gray-500">研究方向：</span>{paper.direction}</div>
              <div><span className="text-gray-500">当前版本：</span>{paper.versionLabel || `v${paper.currentVersion}`}</div>
            </div>
          </div>
          {paper.myThoughts && (
            <div className="rounded-lg border bg-blue-50 p-4">
              <h2 className="font-medium mb-2 text-blue-900">我的思考</h2>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{paper.myThoughts}</p>
            </div>
          )}
          <div className="rounded-lg border bg-white p-4">
            <PaperVersions paperId={paper.id} versions={JSON.parse(JSON.stringify(paper.versions))} />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="font-medium">投稿历程</h2>
          {paper.submissions.length === 0 ? (
            <p className="text-gray-400 text-sm">暂无投稿记录</p>
          ) : (
            paper.submissions.map((sub: any) => (
              <div key={sub.id} className="rounded-lg border bg-white p-4 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">第{sub.submissionRound}次投稿</span>
                  <StatusBadge value={sub.status} />
                </div>
                <p className="text-gray-500">期刊：{sub.venueName}</p>
                {sub.decision && <p className="mt-1"><StatusBadge value={sub.decision} /></p>}
                {sub.reviewerComments && (
                  <p className="mt-2 text-gray-600 bg-gray-50 rounded p-2 whitespace-pre-wrap text-xs">{sub.reviewerComments}</p>
                )}
                {sub.revisions.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-gray-400 text-xs">返修轮次：</span>
                    {sub.revisions.map((rev: any) => (
                      <span key={rev.id} className="ml-1 text-xs"><StatusBadge value={rev.status} /></span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="font-medium mb-3">附件</h2>
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
      </div>
    </div>
  );
}
