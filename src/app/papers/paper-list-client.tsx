"use client";

import { useMemo, useState } from "react";
import { PaperTable } from "@/components/papers/paper-table";
import { PaperForm } from "@/components/papers/paper-form";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select";
import { Plus, Search, Star } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "全部", label: "全部状态" },
  { value: "writing", label: "撰写中" },
  { value: "ready_to_submit", label: "待投稿" },
  { value: "submitted", label: "已投稿" },
  { value: "with_editor", label: "编辑处理中" },
  { value: "under_review", label: "外审中" },
  { value: "minor_revision", label: "小修" },
  { value: "major_revision", label: "大修" },
  { value: "accepted", label: "已接收" },
  { value: "rejected", label: "已拒稿" },
  { value: "published", label: "已发表" },
];

export function PaperListClient({ papers, initialFilter = "全部", initialPriorityOnly = false, initialMode = "", initialScope = "" }: { papers: any[]; initialFilter?: string; initialPriorityOnly?: boolean; initialMode?: string; initialScope?: string }) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState(initialFilter);
  const [keyword, setKeyword] = useState("");
  const [priorityOnly, setPriorityOnly] = useState(initialPriorityOnly);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return papers.filter((p: any) => {
      if (filter !== "全部" && p.status !== filter) return false;
      if (priorityOnly && !p.isPriority) return false;
      if (initialMode === "process" && !["submitted","with_editor","awaiting_reviewer_assignment","under_review","minor_revision","major_revision"].includes(p.status)) return false;
      if (initialScope === "activeStudents" && p.student?.status === "graduated") return false;
      if (q && ![p.title, p.student?.name, p.targetVenue, p.direction].some((v) => String(v || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [papers, filter, keyword, priorityOnly, initialMode, initialScope]);

  return (
    <>
      <section className="paper-panel">
        <div className="paper-toolbar">
          <div className="paper-toolbar-left">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input className="paper-search-input pl-8" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索论文、学生或期刊" />
            </div>
            <NativeSelect value={filter} onValueChange={(v) => v && setFilter(v)} className="w-40 h-8 text-xs">
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </NativeSelect>
            <button type="button" onClick={() => setPriorityOnly((v) => !v)} className={`h-8 px-2.5 rounded-md border text-[11px] flex items-center gap-1.5 ${priorityOnly ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-slate-600 border-slate-200"}`}>
              <Star className="h-3.5 w-3.5" fill={priorityOnly ? "currentColor" : "none"} />重点跟踪
            </button>
            <span className="paper-muted-note">当前 {filtered.length} 篇</span>
          </div>
          <Button className="paper-primary-button" size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" />添加小论文</Button>
        </div>
        <div className="paper-panel-body"><div className="paper-table-shell"><PaperTable papers={filtered} /></div></div>
      </section>
      <PaperForm open={showForm} onOpenChange={setShowForm} paper={null} />
    </>
  );
}
