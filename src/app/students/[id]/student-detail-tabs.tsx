"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";

export function StudentDetailTabs({ student }: { student: any }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleExpand(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <Tabs defaultValue="papers">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="papers">小论文 ({student.papers.length})</TabsTrigger>
        <TabsTrigger value="thesis">大论文 ({student.theses.length})</TabsTrigger>
        <TabsTrigger value="timeline">时间线 ({student.timelineEvents.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="papers" className="space-y-2 mt-4">
        {student.papers.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">暂无小论文</p>
        ) : (
          student.papers.map((paper: any) => (
            <div key={paper.id} className="rounded-lg border bg-white p-3">
              <div className="flex items-center gap-2">
                <span
                  className="font-medium truncate cursor-pointer hover:text-blue-600 text-sm"
                  onClick={() => router.push(`/papers/${paper.id}`)}
                >
                  {paper.title}
                </span>
                <StatusBadge value={paper.status} />
                <span className="text-gray-400 text-xs shrink-0">
                  {paper.versionLabel || `v${paper.currentVersion}`}
                </span>
                <span className="text-gray-400 text-xs shrink-0">· {paper.targetVenue ?? "未指定"}</span>
              </div>
              {paper.submissions.length > 0 && (
                <div className="mt-1">
                  <button
                    onClick={() => toggleExpand(paper.id)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    投稿记录：{paper.submissions.length}次投稿
                  </button>
                  {expanded[paper.id] && (
                    <div className="mt-1 ml-2 space-y-0.5">
                      {paper.submissions.map((sub: any) => (
                        <div key={sub.id} className="text-xs text-gray-600">
                          · 第{sub.submissionRound}次 → {sub.venueName}
                          {sub.decision && <span className="ml-1"><StatusBadge value={sub.decision} /></span>}
                          {sub.revisions.length > 0 && (
                            <span className="text-gray-400 ml-1">
                              ({sub.revisions.length}轮返修)
                              {sub.revisions.some((r: any) => r.status === "revising") && <span className="text-yellow-600 ml-1">●返修中</span>}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </TabsContent>

      <TabsContent value="thesis" className="space-y-4 mt-4">
        {student.theses.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">暂无大论文</p>
        ) : (
          student.theses.map((thesis: any) => (
            <div key={thesis.id} className="rounded-lg border bg-white p-4 cursor-pointer" onClick={() => router.push(`/theses/${thesis.id}`)}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium hover:text-blue-600">{thesis.title}</span>
                <div className="flex gap-1">
                  <StatusBadge value={thesis.stage} />
                  <StatusBadge value={thesis.status} />
                </div>
              </div>
              {thesis.score && <p className="text-sm text-gray-500">分数：{thesis.score}</p>}
              <div className="text-xs text-gray-400 mt-1">审稿意见：{thesis.reviews.length} 条</div>
            </div>
          ))
        )}
      </TabsContent>

      <TabsContent value="timeline" className="mt-4">
        {student.timelineEvents.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">暂无时间线</p>
        ) : (
          <div className="space-y-3 ml-2">
            {student.timelineEvents.map((evt: any) => (
              <div key={evt.id} className="flex gap-3 text-sm">
                <div className="text-gray-400 w-24 shrink-0">
                  {new Date(evt.eventDate).toLocaleDateString("zh-CN")}
                </div>
                <div className="w-0.5 bg-gray-200 shrink-0" />
                <div>
                  <p className="font-medium">{evt.title}</p>
                  {evt.description && <p className="text-gray-500 text-xs">{evt.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
