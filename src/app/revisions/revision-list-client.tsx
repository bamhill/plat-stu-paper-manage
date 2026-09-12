"use client";

import { useMemo, useState } from "react";
import { RevisionTable } from "@/components/revisions/revision-table";
import { RevisionForm } from "@/components/revisions/revision-form";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

export function RevisionListClient({ revisions, initialView = "all" }: { revisions: any[]; initialView?: string }) {
  const [showForm, setShowForm] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [view, setView] = useState(initialView);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return revisions.filter((r: any) => {
      if (view === "pending" && (r.submittedAt || r.status === "completed")) return false;
      if (view === "overdue" && (!r.dueAt || new Date(r.dueAt) >= new Date() || r.submittedAt || r.status === "completed")) return false;
      if (view === "submitted" && !(r.submittedAt || r.status === "completed" || r.status === "submitted")) return false;
      if (view === "major" && !["major","major_revision"].includes(r.revisionType)) return false;
      if (view === "minor" && !["minor","minor_revision"].includes(r.revisionType)) return false;
      if (q && ![r.submission?.paper?.title, r.submission?.paper?.student?.name, r.submission?.venueName, r.revisionType, r.status].some((v) => String(v || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [revisions, keyword, view]);

  return (
    <>
      <section className="paper-panel">
        <div className="paper-toolbar">
          <div className="paper-toolbar-left">
            <div className="relative"><Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" /><input className="paper-search-input pl-8" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索论文、学生或期刊" /></div>
            <button type="button" onClick={() => setView(view === "pending" ? "all" : "pending")} className={`h-8 px-2.5 rounded-md border text-[11px] ${view === "pending" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-slate-600 border-slate-200"}`}>只看待完成</button>
            <span className="paper-muted-note">{filtered.length} 条</span>
          </div>
          <Button className="paper-primary-button" size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" />添加返修</Button>
        </div>
        <div className="paper-panel-body"><div className="paper-table-shell"><RevisionTable revisions={filtered} /></div></div>
      </section>
      <RevisionForm open={showForm} onOpenChange={setShowForm} revision={null} />
    </>
  );
}
