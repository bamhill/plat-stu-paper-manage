"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { RevisionForm } from "@/components/revisions/revision-form";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Plus, Search } from "lucide-react";

export function QueryClient({ papers, students }: { papers: any[]; students: any[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());
  const [expandedPapers, setExpandedPapers] = useState<Set<number>>(new Set());
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<number>>(new Set());
  const [newRevision, setNewRevision] = useState<any | null>(null);

  function toggleStudent(id: number) { const n = new Set(expandedStudents); if (n.has(id)) n.delete(id); else n.add(id); setExpandedStudents(n); }
  function togglePaper(id: number) { const n = new Set(expandedPapers); if (n.has(id)) n.delete(id); else n.add(id); setExpandedPapers(n); }
  function toggleSubmission(id: number) { const n = new Set(expandedSubmissions); if (n.has(id)) n.delete(id); else n.add(id); setExpandedSubmissions(n); }

  const filteredPapers = papers.filter((p: any) => {
    const m = !search || p.title.includes(search) || p.student.name.includes(search) || (p.targetVenue && p.targetVenue.includes(search));
    const s = statusFilter === "全部" || p.status === statusFilter;
    return m && s;
  });

  const filteredStudents = students.filter((s: any) => {
    const m = !search || s.name.includes(search) || s.papers.some((p: any) => p.title.includes(search));
    return m;
  });

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索学生姓名、论文标题、期刊..." className="pl-9" />
        </div>
        <NativeSelect value={statusFilter} onValueChange={(v) => setStatusFilter(v)} className="w-36">
          <option value="全部">全部状态</option>
          <option value="writing">撰写中</option>
          <option value="ready_to_submit">待投稿</option>
          <option value="submitted">已投稿</option>
          <option value="with_editor">编辑处理中</option>
          <option value="under_review">外审中</option>
          <option value="minor_revision">小修</option>
          <option value="major_revision">大修</option>
          <option value="accepted">已接收</option>
          <option value="rejected">已拒稿</option>
          <option value="published">已发表</option>
        </NativeSelect>
      </div>

      <Tabs defaultValue="papers">
        <TabsList>
          <TabsTrigger value="papers">按论文 ({filteredPapers.length})</TabsTrigger>
          <TabsTrigger value="students">按学生 ({filteredStudents.length})</TabsTrigger>
        </TabsList>

        {/* Tab 1: By Paper */}
        <TabsContent value="papers" className="mt-4 space-y-3">
          {filteredPapers.map((paper: any) => {
            const isExpanded = expandedPapers.has(paper.id);
            return (
              <div key={paper.id} className="rounded-lg border bg-white">
                <div className="p-4 flex items-start gap-3">
                  <button onClick={() => togglePaper(paper.id)} className="mt-1 text-gray-400 hover:text-gray-600">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 cursor-pointer" onClick={() => router.push(`/papers/${paper.id}`)}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium hover:text-blue-600">{paper.title}</span>
                      <StatusBadge value={paper.status} />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {paper.student.name} · {paper.paperType === "journal" ? "期刊" : "会议"}
                      {paper.targetVenue && ` · ${paper.targetVenue}`}
                      <span className="ml-2">{paper.versionLabel || `v${paper.currentVersion}`}</span>
                      <span className="ml-2">{paper.submissions?.length || 0}次投稿</span>
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t bg-gray-50/50 px-8 py-3 space-y-2">
                    {paper.submissions?.length === 0 ? (
                      <p className="text-xs text-gray-400">暂无投稿记录</p>
                    ) : (
                      paper.submissions.map((sub: any) => {
                        const subExpanded = expandedSubmissions.has(sub.id);
                        return (
                          <div key={sub.id} className="text-sm">
                            <div className="flex items-center gap-2 py-1">
                              <button onClick={() => toggleSubmission(sub.id)} className="text-gray-400 hover:text-gray-600">
                                {subExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              </button>
                              <span className="font-medium">第{sub.submissionRound}次投稿</span>
                              <span className="text-gray-500">— {sub.venueName}</span>
                              <StatusBadge value={sub.status} />
                              {sub.decision && <StatusBadge value={sub.decision} />}
                              <span className="text-xs text-gray-400">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("zh-CN") : ""}</span>
                              <span className="text-xs text-gray-400">· {sub.revisions?.length || 0}轮返修</span>
                            </div>
                            {subExpanded && sub.revisions?.map((rev: any) => (
                              <div key={rev.id} className="ml-7 mb-2 flex items-center gap-3 text-xs text-gray-600 bg-white rounded border px-3 py-1.5">
                                <span>第{rev.revisionRound}轮</span>
                                <StatusBadge value={rev.revisionType} />
                                <StatusBadge value={rev.status} />
                                <span>收到：{rev.receivedAt ? new Date(rev.receivedAt).toLocaleDateString("zh-CN") : "-"}</span>
                                <span>截止：{rev.dueAt ? new Date(rev.dueAt).toLocaleDateString("zh-CN") : "-"}</span>
                                {rev.commentsSummary && <span className="text-gray-400 truncate max-w-xs">{rev.commentsSummary}</span>}
                              </div>
                            ))}
                            {subExpanded && (
                              <div className="ml-7 mb-2">
                                <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1" onClick={() => setNewRevision({ submissionId: sub.id, revisionRound: (sub.revisions?.length || 0) + 1 })}>
                                  <Plus className="h-3 w-3" />添加返修轮次
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        {/* Tab 2: By Student */}
        <TabsContent value="students" className="mt-4 space-y-3">
          {filteredStudents.map((student: any) => {
            const isExpanded = expandedStudents.has(student.id);
            return (
              <div key={student.id} className="rounded-lg border bg-white">
                <div className="p-4 flex items-start gap-3">
                  <button onClick={() => toggleStudent(student.id)} className="mt-1 text-gray-400 hover:text-gray-600">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 cursor-pointer" onClick={() => router.push(`/students/${student.id}`)}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium hover:text-blue-600">{student.name}</span>
                      <StatusBadge value={student.status} />
                      <span className="text-xs text-gray-400">{student.enrollmentYear}级</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {student.degreeType} · 小论文 {student.papers?.length || 0} 篇
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t bg-gray-50/50 px-8 py-3 space-y-2">
                    {student.papers?.length === 0 ? (
                      <p className="text-xs text-gray-400">暂无小论文</p>
                    ) : (
                      student.papers.map((paper: any) => {
                        const pe = expandedPapers.has(paper.id);
                        return (
                          <div key={paper.id} className="text-sm">
                            <div className="flex items-center gap-2 py-1">
                              <button onClick={() => togglePaper(paper.id)} className="text-gray-400 hover:text-gray-600">
                                {pe ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              </button>
                              <span className="font-medium cursor-pointer hover:text-blue-600" onClick={() => router.push(`/papers/${paper.id}`)}>{paper.title}</span>
                              <StatusBadge value={paper.status} />
                              <span className="text-xs text-gray-400">{paper.submissions?.length || 0}次投稿</span>
                            </div>
                            {pe && paper.submissions?.map((sub: any) => {
                              const se = expandedSubmissions.has(sub.id);
                              return (
                                <div key={sub.id} className="ml-7">
                                  <div className="flex items-center gap-2 py-1 text-xs">
                                    <button onClick={() => toggleSubmission(sub.id)} className="text-gray-400 hover:text-gray-600">
                                      {se ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    </button>
                                    <span>第{sub.submissionRound}次 · {sub.venueName}</span>
                                    <StatusBadge value={sub.status} />
                                    {sub.decision && <StatusBadge value={sub.decision} />}
                                    <span className="text-gray-400">{sub.revisions?.length || 0}轮返修</span>
                                  </div>
                                  {se && sub.revisions?.map((rev: any) => (
                                    <div key={rev.id} className="ml-7 mb-1 flex items-center gap-2 text-xs text-gray-600 bg-white rounded border px-3 py-1.5">
                                      <span>第{rev.revisionRound}轮</span>
                                      <StatusBadge value={rev.revisionType} />
                                      <StatusBadge value={rev.status} />
                                      <span>收到：{rev.receivedAt ? new Date(rev.receivedAt).toLocaleDateString("zh-CN") : "-"}</span>
                                      {rev.commentsSummary && <span className="text-gray-400 truncate max-w-xs">{rev.commentsSummary}</span>}
                                    </div>
                                  ))}
                                  {se && (
                                    <div className="ml-7 mb-1">
                                      <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1" onClick={() => setNewRevision({ submissionId: sub.id, revisionRound: (sub.revisions?.length || 0) + 1 })}>
                                        <Plus className="h-3 w-3" />添加返修轮次
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      {filteredPapers.length === 0 && filteredStudents.length === 0 && (
        <p className="text-center text-gray-400 py-12">无匹配结果</p>
      )}
      <RevisionForm open={!!newRevision} onOpenChange={(o) => !o && setNewRevision(null)} revision={newRevision} />
    </div>
  );
}
