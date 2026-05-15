"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { ChevronDown, ChevronRight, Download, FileText } from "lucide-react";

const DECISION_BORDER: Record<string, string> = {
  accept: "border-l-green-400",
  reject: "border-l-red-400",
  minor_revision: "border-l-yellow-400",
  major_revision: "border-l-orange-400",
  under_review: "border-l-blue-300",
};

export function SubmissionTimeline({ submissions, subAttachments }: { submissions: any[]; subAttachments: any[] }) {
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [expandedRevisions, setExpandedRevisions] = useState<Set<number>>(new Set());

  function toggleComments(id: number) { const n = new Set(expandedComments); if (n.has(id)) n.delete(id); else n.add(id); setExpandedComments(n); }
  function toggleRevisions(id: number) { const n = new Set(expandedRevisions); if (n.has(id)) n.delete(id); else n.add(id); setExpandedRevisions(n); }

  if (submissions.length === 0) return <p className="text-gray-400 text-sm">暂无投稿记录</p>;

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return (
    <div className="space-y-3">
      {submissions.map((sub: any, idx: number) => {
        const isExpanded = expandedComments.has(sub.id);
        const revExpanded = expandedRevisions.has(sub.id);
        const atts = (subAttachments || []).filter((a: any) => a.relatedId === sub.id);
        const hasComments = !!(sub.reviewerComments || sub.editorComments);
        const hasRevisions = (sub.revisions?.length || 0) > 0;
        const borderColor = DECISION_BORDER[sub.decision] || "border-l-blue-200";

        return (
          <div key={sub.id} className={`rounded-lg border border-l-4 bg-white p-3 text-sm ${borderColor} shadow-sm`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                  {sub.submissionRound}
                </span>
                <span className="font-medium">{sub.venueName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  sub.status === "under_review" ? "bg-blue-100 text-blue-700" :
                  sub.status === "decisioned" ? "bg-purple-100 text-purple-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {sub.status === "pending" ? "待处理" : sub.status === "under_review" ? "审稿中" : sub.status === "decisioned" ? "已决定" : sub.status}
                </span>
                {sub.decision && <StatusBadge value={sub.decision} />}
              </div>
            </div>

            {/* Meta line */}
            <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-2">
              <span>编号：{sub.manuscriptNo || "-"}</span>
              <span>·</span>
              <span>投稿：{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("zh-CN") : "-"}</span>
              {sub.decisionAt && <><span>·</span><span>决定：{new Date(sub.decisionAt).toLocaleDateString("zh-CN")}</span></>}
            </div>

            {/* Comments — expandable */}
            {hasComments && (
              <div className="mt-1">
                <button onClick={() => toggleComments(sub.id)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  审稿意见
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1.5">
                    {sub.reviewerComments && (
                      <div className="text-xs text-gray-700 bg-gray-50 rounded p-2 border whitespace-pre-wrap">{sub.reviewerComments}</div>
                    )}
                    {sub.editorComments && (
                      <div className="text-xs text-gray-600 bg-amber-50 rounded p-2 border border-amber-100 whitespace-pre-wrap">
                        <span className="font-medium text-amber-800">编辑：</span>{sub.editorComments}
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
                  返修记录 · {sub.revisions.length}轮
                </button>
                {revExpanded && (
                  <div className="ml-4 mt-1.5 space-y-1.5">
                    {sub.revisions.map((rev: any) => (
                      <div key={rev.id} className="text-xs border rounded p-2 bg-gray-50/70">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">第{rev.revisionRound}轮</span>
                          <StatusBadge value={rev.revisionType} />
                          <StatusBadge value={rev.status} />
                        </div>
                        <div className="text-gray-400">
                          收到：{rev.receivedAt ? new Date(rev.receivedAt).toLocaleDateString("zh-CN") : "-"}
                          {" · "}截止：{rev.dueAt ? new Date(rev.dueAt).toLocaleDateString("zh-CN") : "-"}
                          {" · "}提交：{rev.submittedAt ? new Date(rev.submittedAt).toLocaleDateString("zh-CN") : "-"}
                        </div>
                        {rev.commentsSummary && <p className="mt-1 text-gray-600">{rev.commentsSummary}</p>}
                        {rev.responseSummary && <p className="mt-0.5 text-blue-700 font-medium">结果：{rev.responseSummary}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Attachments — read-only list */}
            {atts.length > 0 && (
              <div className="mt-2 pt-2 border-t border-dashed">
                <p className="text-[10px] text-gray-400 mb-1">附件</p>
                <div className="space-y-0.5">
                  {atts.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between text-[11px] py-0.5 pl-1 hover:bg-gray-50 rounded">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileText className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="truncate">{a.fileName}</span>
                        <span className="text-gray-400 shrink-0">{formatSize(a.fileSize)}</span>
                        {a.description && <span className="text-gray-400 truncate">— {a.description}</span>}
                      </div>
                      <a href={`/api/files/${a.filePath}`} download className="text-blue-500 hover:text-blue-700 shrink-0 ml-2">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
