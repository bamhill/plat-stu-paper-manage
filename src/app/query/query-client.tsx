"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

export function QueryClient({ papers }: { papers: any[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [expandedPapers, setExpandedPapers] = useState<Set<number>>(new Set());
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<number>>(new Set());

  // Get unique students for search
  const filtered = papers.filter((p: any) => {
    const matchesSearch = !search || p.title.includes(search) || p.student.name.includes(search) || (p.targetVenue && p.targetVenue.includes(search));
    const matchesStatus = statusFilter === "全部" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function togglePaper(id: number) {
    const next = new Set(expandedPapers);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedPapers(next);
  }

  function toggleSubmission(id: number) {
    const next = new Set(expandedSubmissions);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedSubmissions(next);
  }

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索论文标题、学生姓名、目标期刊..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="全部">全部状态</SelectItem>
            <SelectItem value="writing">撰写中</SelectItem>
            <SelectItem value="submitted">已投稿</SelectItem>
            <SelectItem value="with_editor">编辑处理中</SelectItem>
            <SelectItem value="under_review">外审中</SelectItem>
            <SelectItem value="minor_revision">小修</SelectItem>
            <SelectItem value="major_revision">大修</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-gray-400 mb-4">{filtered.length} 篇论文</p>

      <div className="space-y-3">
        {filtered.map((paper: any) => {
          const isExpanded = expandedPapers.has(paper.id);
          return (
            <div key={paper.id} className="rounded-lg border bg-white">
              {/* Paper Header */}
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

              {/* Expanded: Submissions */}
              {isExpanded && (
                <div className="border-t bg-gray-50/50 px-8 py-3 space-y-2">
                  {paper.submissions.length === 0 ? (
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
                            <span className="text-xs text-gray-400">
                              {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("zh-CN") : ""}
                            </span>
                            <span className="text-xs text-gray-400">· {sub.revisions?.length || 0}轮返修</span>
                          </div>

                          {/* Expanded: Revisions */}
                          {subExpanded && sub.revisions?.length > 0 && (
                            <div className="ml-7 space-y-1 mb-2">
                              {sub.revisions.map((rev: any) => (
                                <div key={rev.id} className="flex items-center gap-3 text-xs text-gray-600 bg-white rounded border px-3 py-1.5">
                                  <span>第{rev.revisionRound}轮</span>
                                  <StatusBadge value={rev.revisionType} />
                                  <StatusBadge value={rev.status} />
                                  <span>收到：{rev.receivedAt ? new Date(rev.receivedAt).toLocaleDateString("zh-CN") : "-"}</span>
                                  <span>截止：{rev.dueAt ? new Date(rev.dueAt).toLocaleDateString("zh-CN") : "-"}</span>
                                  {rev.commentsSummary && <span className="text-gray-400 truncate max-w-xs">{rev.commentsSummary}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          {subExpanded && (!sub.revisions || sub.revisions.length === 0) && (
                            <div className="ml-7 text-xs text-gray-400 mb-2">暂无返修记录</div>
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
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-12">无匹配结果</p>
        )}
      </div>
    </div>
  );
}
