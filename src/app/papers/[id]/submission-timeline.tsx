"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { AttachmentUpload } from "@/components/shared/attachment-upload";
import { ChevronDown, ChevronRight } from "lucide-react";

export function SubmissionTimeline({ submissions, subAttachments }: { submissions: any[]; subAttachments: any[] }) {
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [expandedRevisions, setExpandedRevisions] = useState<Set<number>>(new Set());

  function toggleComments(id: number) {
    const n = new Set(expandedComments);
    if (n.has(id)) n.delete(id); else n.add(id);
    setExpandedComments(n);
  }

  function toggleRevisions(id: number) {
    const n = new Set(expandedRevisions);
    if (n.has(id)) n.delete(id); else n.add(id);
    setExpandedRevisions(n);
  }

  if (submissions.length === 0) {
    return <p className="text-gray-400 text-sm">暂无投稿记录</p>;
  }

  return (
    <div className="space-y-3">
      {submissions.map((sub: any) => {
        const isExpanded = expandedComments.has(sub.id);
        const revExpanded = expandedRevisions.has(sub.id);
        const atts = (subAttachments || []).filter((a: any) => a.relatedId === sub.id);
        const hasComments = !!(sub.reviewerComments || sub.editorComments);
        const hasRevisions = (sub.revisions?.length || 0) > 0;

        return (
          <div key={sub.id} className="rounded-lg border bg-white p-3 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">第{sub.submissionRound}次投稿 — {sub.venueName}</span>
              <div className="flex items-center gap-1">
                <StatusBadge value={sub.status} />
                {sub.decision && <StatusBadge value={sub.decision} />}
              </div>
            </div>
            <div className="text-xs text-gray-400 mb-2">
              稿件编号：{sub.manuscriptNo || "-"}
              {" · "}投稿日期：{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("zh-CN") : "-"}
              {sub.decisionAt && ` · 决定日期：${new Date(sub.decisionAt).toLocaleDateString("zh-CN")}`}
            </div>

            {/* Reviewer comments — expandable */}
            {hasComments && (
              <div>
                <button onClick={() => toggleComments(sub.id)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mb-1">
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  查看审稿意见
                </button>
                {isExpanded && (
                  <div className="space-y-1 ml-3">
                    {sub.reviewerComments && (
                      <div className="text-xs text-gray-700 bg-gray-50 rounded p-2 whitespace-pre-wrap">{sub.reviewerComments}</div>
                    )}
                    {sub.editorComments && (
                      <div className="text-xs text-gray-600 bg-yellow-50 rounded p-2 whitespace-pre-wrap">
                        <span className="font-medium">编辑意见：</span>{sub.editorComments}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Revisions — expandable */}
            {hasRevisions && (
              <div className="mt-2">
                <button onClick={() => toggleRevisions(sub.id)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                  {revExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  返修记录 ({sub.revisions.length}轮)
                </button>
                {revExpanded && (
                  <div className="ml-3 mt-1 space-y-1">
                    {sub.revisions.map((rev: any) => (
                      <div key={rev.id} className="text-xs border rounded p-1.5 bg-gray-50">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">第{rev.revisionRound}轮</span>
                          <StatusBadge value={rev.revisionType} />
                          <StatusBadge value={rev.status} />
                        </div>
                        <div className="text-gray-400 mt-0.5">
                          收到：{rev.receivedAt ? new Date(rev.receivedAt).toLocaleDateString("zh-CN") : "-"}
                          {" · "}截止：{rev.dueAt ? new Date(rev.dueAt).toLocaleDateString("zh-CN") : "-"}
                          {" · "}提交：{rev.submittedAt ? new Date(rev.submittedAt).toLocaleDateString("zh-CN") : "-"}
                        </div>
                        {rev.commentsSummary && <p className="mt-0.5 text-gray-600">{rev.commentsSummary}</p>}
                        {rev.responseSummary && <p className="mt-0.5 text-blue-600">结果：{rev.responseSummary}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submission attachments */}
            <div className="mt-2 pt-2 border-t">
              <AttachmentUpload
                relatedType="submission"
                relatedId={sub.id}
                existingAttachments={atts.map((a: any) => ({
                  id: a.id, fileName: a.fileName, filePath: a.filePath,
                  fileSize: a.fileSize, fileType: a.fileType,
                  description: a.description, uploadedAt: a.uploadedAt,
                }))}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
