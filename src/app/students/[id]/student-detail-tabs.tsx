"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import { ChevronDown, ChevronRight, FileText, BookOpen } from "lucide-react";
import { paperDisplayTitle } from "@/lib/paper-display";

export function StudentDetailTabs({ student }: { student: any }) {
  const router = useRouter();
  const [expandedPapers, setExpandedPapers] = useState<Record<string, boolean>>({});
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({});

  function togglePaper(id: string) { setExpandedPapers((prev) => ({ ...prev, [id]: !prev[id] })); }
  function toggleSubmission(id: string) { setExpandedSubmissions((prev) => ({ ...prev, [id]: !prev[id] })); }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 items-start">
        <section className="paper-detail-card xl:col-span-2">
          <div className="paper-detail-card-head"><span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" />小论文</span><span className="paper-muted-note">{student.papers.length} 篇</span></div>
          <div className="paper-detail-card-body space-y-2">
            {student.papers.length === 0 ? <p className="text-gray-400 text-sm">暂无小论文</p> : student.papers.map((paper: any) => (
              <div key={paper.id} className="rounded-md border border-slate-200 bg-white overflow-hidden">
                <div className="px-3 py-2.5 flex items-start gap-2.5 hover:bg-slate-50/70">
                  <button onClick={() => togglePaper(String(paper.id))} className="mt-0.5 text-slate-400 hover:text-slate-600 shrink-0">
                    {expandedPapers[paper.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {paper.isPriority ? <span className="text-amber-500 text-xs">★</span> : null}
                      <button className="font-semibold text-[12px] text-slate-800 hover:text-blue-700 truncate" onClick={() => router.push(`/papers/${paper.id}`)}>{paperDisplayTitle(paper.title)}</button>
                      <StatusBadge value={paper.status} />
                      <span className="text-[10px] text-slate-400">{paper.targetVenue || "未定目标"}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                      <span>{paper.paperType === "journal" ? "期刊" : "会议"}</span>
                      <span>{paper.versionLabel || `v${paper.currentVersion}`}</span>
                      <span>{paper.submissions.length} 次投稿</span>
                    </div>
                    {paper.myThoughts && <p className="mt-1.5 text-[10px] text-blue-700 bg-blue-50 rounded px-2 py-1">{paper.myThoughts}</p>}
                  </div>
                </div>

                {expandedPapers[paper.id] && (
                  <div className="border-t border-slate-100 bg-slate-50/70 px-8 py-2 space-y-1">
                    {paper.submissions.length === 0 ? <p className="text-[10px] text-slate-400">暂无投稿记录</p> : paper.submissions.map((sub: any) => (
                      <div key={sub.id} className="text-[10px]">
                        <button onClick={() => toggleSubmission(`sub-${sub.id}`)} className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 w-full text-left py-1">
                          {expandedSubmissions[`sub-${sub.id}`] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          <span className="font-medium">第{sub.submissionRound}次投稿</span><span>→ {sub.venueName}</span>
                          <StatusBadge value={sub.status} />{sub.decision && <StatusBadge value={sub.decision} />}
                          <span className="ml-auto text-slate-400">{sub.revisions?.length || 0}轮返修</span>
                        </button>
                        {expandedSubmissions[`sub-${sub.id}`] && (
                          <div className="ml-4 mb-1.5 space-y-1.5">
                            {sub.reviewerComments && <p className="text-slate-600 bg-white rounded border border-slate-200 p-2 whitespace-pre-wrap">{sub.reviewerComments}</p>}
                            {sub.revisions?.map((rev: any) => (
                              <div key={rev.id} className="bg-white rounded border border-slate-200 px-2 py-1.5 flex items-center gap-2 flex-wrap">
                                <span className="font-medium">第{rev.revisionRound}轮返修</span><StatusBadge value={rev.revisionType} /><StatusBadge value={rev.status} />
                                <span className="text-slate-400">收到 {formatDate(rev.receivedAt)}</span><span className="text-slate-400">截止 {formatDate(rev.dueAt)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="paper-detail-card">
          <div className="paper-detail-card-head"><span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4" />大论文</span><span className="paper-muted-note">{student.theses.length} 篇</span></div>
          <div className="paper-detail-card-body space-y-2">
            {student.theses.length === 0 ? <p className="text-gray-400 text-sm">暂无大论文</p> : student.theses.map((thesis: any) => (
              <button key={thesis.id} className="w-full rounded-md border border-slate-200 p-3 text-left hover:bg-slate-50" onClick={() => router.push(`/theses/${thesis.id}`)}>
                <div className="font-semibold text-[11px] text-slate-800 line-clamp-2">{thesis.title}</div>
                <div className="mt-2 flex gap-1.5 flex-wrap"><StatusBadge value={thesis.stage} /><StatusBadge value={thesis.status} /></div>
                <div className="mt-2 text-[10px] text-slate-400">外审意见 {thesis.reviews.length} 条{thesis.score ? ` · 答辩 ${thesis.score}` : ""}</div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {student.transfersFrom?.length > 0 && (
        <section className="paper-detail-card">
          <div className="paper-detail-card-head"><span>已交接论文</span><span className="paper-muted-note">{student.transfersFrom.length} 篇</span></div>
          <div className="paper-detail-card-body space-y-2">
            {student.transfersFrom.map((t: any) => (
              <button key={t.id} className="w-full rounded-md border border-slate-200 px-3 py-2 text-left hover:bg-slate-50" onClick={() => router.push(`/papers/${t.paper.id}`)}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium text-slate-700">{paperDisplayTitle(t.paper.title)}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">现由 {t.toStudent.name} 负责</span>
                </div>
                {t.notes && <div className="mt-1 text-[10px] text-slate-400">{t.notes}</div>}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="paper-detail-card">
        <div className="paper-detail-card-head"><span>论文推进时间线</span><span className="paper-muted-note">最近进展</span></div>
        <div className="paper-detail-card-body">
          <div className="space-y-4">
            {student.papers.map((paper: any) => {
              const events: { date: Date; label: string; detail: string; color: string }[] = [];
              paper.submissions.forEach((sub: any) => {
                if (sub.submittedAt) events.push({ date: new Date(sub.submittedAt), label: "投稿", detail: `${sub.venueName}（第${sub.submissionRound}次）`, color: "bg-blue-400" });
                if (sub.underReviewAt) events.push({ date: new Date(sub.underReviewAt), label: "进入外审", detail: sub.venueName, color: "bg-cyan-500" });
                if (sub.decisionAt && sub.decision && sub.decision !== "under_review") {
                  const labels: Record<string, string> = { minor_revision: "小修", major_revision: "大修", accept: "接收", reject: "拒稿" };
                  events.push({ date: new Date(sub.decisionAt), label: "审稿决定", detail: `${labels[sub.decision] || sub.decision} — ${sub.venueName}`, color: sub.decision === "accept" ? "bg-green-500" : sub.decision === "reject" ? "bg-red-400" : "bg-amber-400" });
                }
                sub.revisions.forEach((rev: any) => {
                  if (rev.receivedAt) events.push({ date: new Date(rev.receivedAt), label: "收到返修", detail: `第${rev.revisionRound}轮 — ${sub.venueName}`, color: "bg-purple-400" });
                  if (rev.submittedAt) events.push({ date: new Date(rev.submittedAt), label: "返修提交", detail: `第${rev.revisionRound}轮 — ${sub.venueName}`, color: "bg-indigo-400" });
                });
              });
              events.sort((a, b) => b.date.getTime() - a.date.getTime());
              if (!events.length) return null;
              return (
                <div key={paper.id} className="grid grid-cols-[220px_1fr] gap-4">
                  <button className="text-left text-[11px] font-semibold text-slate-700 hover:text-blue-700 line-clamp-2" onClick={() => router.push(`/papers/${paper.id}`)}>{paperDisplayTitle(paper.title)}</button>
                  <div className="border-l border-slate-200 pl-4 space-y-1.5">
                    {events.slice(0, 8).map((evt, i) => (
                      <div key={i} className="grid grid-cols-[82px_72px_1fr] gap-2 items-start text-[10px]">
                        <span className="text-slate-400">{formatDate(evt.date)}</span>
                        <span className="font-medium text-slate-600 inline-flex items-center gap-1"><i className={`w-1.5 h-1.5 rounded-full ${evt.color}`} />{evt.label}</span>
                        <span className="text-slate-600">{evt.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
