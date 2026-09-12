"use client";

import { useMemo, useState } from "react";
import { SubmissionTable } from "@/components/submissions/submission-table";
import { SubmissionForm } from "@/components/submissions/submission-form";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

export function SubmissionListClient({
  submissions, currentSubmissionIds = [], initialNewPaperId = null, initialVenue = "",
  initialEditSubmissionId = null, initialView = "all", year,
}: {
  submissions: any[]; currentSubmissionIds?: number[]; initialNewPaperId?: number | null; initialVenue?: string;
  initialEditSubmissionId?: number | null; initialView?: string; year: number;
}) {
  const [showForm, setShowForm] = useState(Boolean(initialNewPaperId));
  const [editTarget, setEditTarget] = useState<any | null>(() => initialEditSubmissionId ? (submissions.find((s: any) => s.id === initialEditSubmissionId) || null) : null);
  const [keyword, setKeyword] = useState("");
  const [view, setView] = useState(initialView);
  const currentIds = useMemo(() => new Set(currentSubmissionIds), [currentSubmissionIds]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return submissions.filter((s: any) => {
      if (view === "year" && (!s.submittedAt || new Date(s.submittedAt).getFullYear() !== year)) return false;
      if (view === "active" && !currentIds.has(s.id)) return false;
      if (view === "revision" && !(s.revisions?.length > 0)) return false;
      if (q && ![s.paper?.title, s.paper?.student?.name, s.venueName, s.manuscriptNo, s.manuscriptTitle, s.firstAuthor, s.correspondingAuthor, s.status, s.decision].some((v) => String(v || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [submissions, keyword, view, year, currentIds]);

  const filters = [["all","全部"],["year",`${year}年`],["active","流程中"],["revision","有返修"]] as const;
  return (
    <>
      <section className="paper-panel">
        <div className="paper-toolbar">
          <div className="paper-toolbar-left">
            <div className="relative"><Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" /><input className="paper-search-input pl-8" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索论文、学生、期刊或稿件号" /></div>
            <div className="flex items-center gap-1">{filters.map(([k,label]) => <button key={k} type="button" onClick={() => setView(k)} className={`h-8 px-2.5 rounded-md border text-[11px] ${view===k?'bg-blue-50 text-blue-700 border-blue-200':'bg-white text-slate-600 border-slate-200'}`}>{label}</button>)}</div>
            <span className="paper-muted-note">{filtered.length} 条记录</span>
          </div>
          <Button className="paper-primary-button" size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" />添加投稿</Button>
        </div>
        <div className="paper-panel-body"><div className="paper-table-shell"><SubmissionTable submissions={filtered} currentSubmissionIds={currentSubmissionIds} /></div></div>
      </section>
      <SubmissionForm open={showForm} onOpenChange={setShowForm} submission={null} initialPaperId={initialNewPaperId} initialVenue={initialVenue} />
      <SubmissionForm open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)} submission={editTarget} />
    </>
  );
}
