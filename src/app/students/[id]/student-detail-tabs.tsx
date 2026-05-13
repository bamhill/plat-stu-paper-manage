"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { ChevronDown, ChevronRight } from "lucide-react";

export function StudentDetailTabs({ student }: { student: any }) {
  const router = useRouter();
  const [expandedPapers, setExpandedPapers] = useState<Record<string, boolean>>({});
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({});

  function togglePaper(id: string) {
    setExpandedPapers(prev => ({ ...prev, [id]: !prev[id] }));
  }
  function toggleSubmission(id: string) {
    setExpandedSubmissions(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-6">
      {/* Section: Papers */}
      <div>
        <h2 className="font-semibold text-base mb-3">小论文 ({student.papers.length})</h2>
        {student.papers.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无小论文</p>
        ) : (
          <div className="space-y-2">
            {student.papers.map((paper: any) => (
              <div key={paper.id} className="rounded-lg border bg-white">
                <div className="p-3 flex items-start gap-3">
                  <button onClick={() => togglePaper(paper.id)} className="mt-0.5 text-gray-400 hover:text-gray-600 shrink-0">
                    {expandedPapers[paper.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-medium truncate cursor-pointer hover:text-blue-600 text-sm"
                        onClick={() => router.push(`/papers/${paper.id}`)}
                      >
                        {paper.title}
                      </span>
                      <StatusBadge value={paper.status} />
                      <span className="text-gray-400 text-xs">{paper.versionLabel || `v${paper.currentVersion}`}</span>
                      <span className="text-gray-400 text-xs">{paper.paperType === "journal" ? "期刊" : "会议"}</span>
                      {paper.targetVenue && <span className="text-gray-400 text-xs">{paper.targetVenue}</span>}
                    </div>
                    {paper.myThoughts && (
                      <p className="text-xs text-blue-700 bg-blue-50 rounded p-1 mt-1">{paper.myThoughts}</p>
                    )}
                    {/* Expandable submissions */}
                    {paper.submissions.length > 0 && expandedPapers[paper.id] && (
                      <div className="mt-2 space-y-1 pl-2 border-l-2 border-blue-200">
                        {paper.submissions.map((sub: any) => (
                          <div key={sub.id} className="text-xs">
                            <button onClick={() => toggleSubmission(`sub-${sub.id}`)} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 w-full text-left py-0.5">
                              {expandedSubmissions[`sub-${sub.id}`] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              <span>第{sub.submissionRound}次投稿 → {sub.venueName}</span>
                              {sub.decision && <StatusBadge value={sub.decision} />}
                              <StatusBadge value={sub.status} />
                              <span className="text-gray-400">{sub.revisions?.length || 0}轮返修</span>
                            </button>
                            {expandedSubmissions[`sub-${sub.id}`] && (
                              <div className="ml-4 space-y-1 mb-1">
                                {sub.reviewerComments && (
                                  <p className="text-gray-600 bg-gray-50 rounded p-1.5 whitespace-pre-wrap">{sub.reviewerComments}</p>
                                )}
                                {sub.revisions?.map((rev: any) => (
                                  <div key={rev.id} className="bg-gray-50 rounded p-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">第{rev.revisionRound}轮返修</span>
                                      <StatusBadge value={rev.revisionType} />
                                      <StatusBadge value={rev.status} />
                                      <span className="text-gray-400">收到：{rev.receivedAt ? new Date(rev.receivedAt).toLocaleDateString("zh-CN") : "-"}</span>
                                      <span className="text-gray-400">截止：{rev.dueAt ? new Date(rev.dueAt).toLocaleDateString("zh-CN") : "-"}</span>
                                    </div>
                                    {rev.commentsSummary && (
                                      <p className="mt-0.5 text-gray-600 whitespace-pre-wrap">{rev.commentsSummary}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {paper.submissions.length === 0 && expandedPapers[paper.id] && (
                      <p className="text-xs text-gray-400 mt-1 ml-0">暂无投稿记录</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: Thesis */}
      <div className="pt-4 border-t">
        <h2 className="font-semibold text-base mb-3">大论文 ({student.theses.length})</h2>
        {student.theses.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无大论文</p>
        ) : (
          <div className="space-y-2 max-w-full">
            {student.theses.map((thesis: any) => (
              <div key={thesis.id} className="rounded-lg border bg-white p-3 cursor-pointer hover:shadow-sm" onClick={() => router.push(`/theses/${thesis.id}`)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium hover:text-blue-600 text-sm truncate">{thesis.title}</span>
                  <StatusBadge value={thesis.stage} />
                  <StatusBadge value={thesis.status} />
                  {thesis.score && <span className="text-sm font-bold text-blue-600">{thesis.score}分</span>}
                </div>
                <div className="text-xs text-gray-400 mt-1">审稿意见：{thesis.reviews.length} 条</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: Timeline */}
      <div className="pt-4 border-t">
        <h2 className="font-semibold text-base mb-3">时间线 ({student.timelineEvents.length})</h2>
        {student.timelineEvents.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无记录</p>
        ) : (
          <div className="space-y-2 ml-2">
            {student.timelineEvents.map((evt: any) => (
              <div key={evt.id} className="flex gap-3 text-sm">
                <div className="text-gray-400 w-28 shrink-0 text-xs pt-0.5">
                  {new Date(evt.eventDate).toLocaleDateString("zh-CN")}
                </div>
                <div className="relative flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  <div className="w-0.5 flex-1 bg-gray-200" />
                </div>
                <div className="pb-3 flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{evt.title}</p>
                  {evt.description && <p className="text-gray-500 text-xs truncate">{evt.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
