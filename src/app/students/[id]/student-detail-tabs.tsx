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

      {/* Section: Timeline (derived from actual paper/submission/revision data) */}
      <div className="pt-4 border-t">
        <h2 className="font-semibold text-base mb-3">时间线</h2>
        {student.papers.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无论文</p>
        ) : (
          <div className="space-y-4 ml-2">
            {student.papers.map((paper: any) => {
              // Collect all events from this paper's submissions and revisions
              const events: { date: Date; label: string; detail: string; color: string }[] = [];

              paper.submissions.forEach((sub: any) => {
                if (sub.submittedAt) {
                  events.push({ date: new Date(sub.submittedAt), label: `投稿`, detail: `${sub.venueName} (第${sub.submissionRound}次)`, color: "bg-blue-400" });
                }
                if (sub.decisionAt && sub.decision && sub.decision !== "under_review") {
                  const decLabels: Record<string, string> = { minor_revision: "小修", major_revision: "大修", accept: "接收", reject: "拒稿" };
                  events.push({ date: new Date(sub.decisionAt), label: `审稿决定`, detail: `${decLabels[sub.decision] || sub.decision} — ${sub.venueName}`, color: sub.decision === "accept" ? "bg-green-400" : sub.decision === "reject" ? "bg-red-400" : "bg-yellow-400" });
                }
                sub.revisions.forEach((rev: any) => {
                  if (rev.receivedAt) {
                    const typeLabels: Record<string, string> = { minor: "小修", major: "大修", resubmit: "重投" };
                    events.push({ date: new Date(rev.receivedAt), label: `返修`, detail: `${typeLabels[rev.revisionType] || rev.revisionType} 第${rev.revisionRound}轮 — ${sub.venueName}`, color: "bg-purple-400" });
                  }
                  if (rev.submittedAt) {
                    events.push({ date: new Date(rev.submittedAt), label: `返修提交`, detail: `第${rev.revisionRound}轮返修已提交 — ${sub.venueName}`, color: "bg-indigo-400" });
                  }
                });
              });

              events.sort((a, b) => b.date.getTime() - a.date.getTime());

              if (events.length === 0) return null;

              return (
                <div key={paper.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                    <span className="font-medium text-sm cursor-pointer hover:text-blue-600" onClick={() => router.push(`/papers/${paper.id}`)}>
                      {paper.title}
                    </span>
                  </div>
                  <div className="ml-1.5 pl-4 border-l-2 border-blue-100 space-y-1.5">
                    {events.map((evt, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <div className="text-gray-400 w-24 shrink-0 pt-0.5">
                          {evt.date.toLocaleDateString("zh-CN")}
                        </div>
                        <div className={`w-1.5 h-1.5 rounded-full ${evt.color} shrink-0 mt-1`} />
                        <div className="pb-1.5">
                          <p><span className="font-medium">{evt.label}</span> — {evt.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
