"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";

export function StudentDetailTabs({ student }: { student: any }) {
  const router = useRouter();

  return (
    <Tabs defaultValue="papers">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="papers">小论文 ({student.papers.length})</TabsTrigger>
        <TabsTrigger value="thesis">大论文 ({student.theses.length})</TabsTrigger>
        <TabsTrigger value="timeline">时间线 ({student.timelineEvents.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="papers" className="space-y-4 mt-4">
        {student.papers.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">暂无小论文</p>
        ) : (
          student.papers.map((paper: any) => (
            <div key={paper.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => router.push(`/papers/${paper.id}`)}>
                <div className="flex items-center gap-2">
                  <span className="font-medium hover:text-blue-600">{paper.title}</span>
                  <StatusBadge value={paper.status} />
                </div>
                <span className="text-gray-400 text-xs">v{paper.currentVersion} · {paper.paperType === "journal" ? "期刊" : "会议"}</span>
              </div>
              {paper.myThoughts && (
                <div className="bg-blue-50 rounded p-2 text-sm text-blue-800 mb-2">{paper.myThoughts}</div>
              )}
              {paper.submissions.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs text-gray-400 mb-1">投稿记录：</p>
                  {paper.submissions.map((sub: any) => (
                    <div key={sub.id} className="text-xs text-gray-600 ml-2 mb-1">
                      · {sub.venueName} (第{sub.submissionRound}次) — <StatusBadge value={sub.status} />
                      {sub.decision && <span className="ml-1"><StatusBadge value={sub.decision} /></span>}
                      {sub.revisions.length > 0 && (
                        <span className="ml-1 text-gray-400">
                          ({sub.revisions.length}轮返修)
                          {sub.revisions.some((r: any) => r.status === "revising") && <span className="text-yellow-600 ml-1">●返修中</span>}
                        </span>
                      )}
                    </div>
                  ))}
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
