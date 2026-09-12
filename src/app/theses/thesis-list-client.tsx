"use client";

import { useMemo, useState } from "react";
import { ThesisTable } from "@/components/theses/thesis-table";
import { ThesisForm } from "@/components/theses/thesis-form";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

export function ThesisListClient({ theses, initialView = "all", initialScope = "" }: { theses: any[]; initialView?: string; initialScope?: string }) {
  const [showForm, setShowForm] = useState(false);
  const [keyword, setKeyword] = useState("");
  const view = initialView;
  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return theses.filter((t: any) => {
      if (initialScope === "activeStudents" && t.student?.status === "graduated") return false;
      if (view === "progress" && t.status !== "in_progress") return false;
      if (view === "review" && !["review","external_review"].includes(t.stage)) return false;
      if (view === "defense" && !(["defense","defended"].includes(t.stage) || t.defenseDate || ["completed","graduated"].includes(t.status))) return false;
      if (q && ![t.title, t.student?.name, t.degreeType, t.stage, t.status].some((v) => String(v || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [theses, keyword, view, initialScope]);

  return (
    <>
      <section className="paper-panel">
        <div className="paper-toolbar">
          <div className="paper-toolbar-left">
            <div className="relative"><Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" /><input className="paper-search-input pl-8" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索论文题目或学生" /></div>
            <span className="paper-muted-note">{filtered.length} 篇</span>
          </div>
          <Button className="paper-primary-button" size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" />添加大论文</Button>
        </div>
        <div className="paper-panel-body"><div className="paper-table-shell"><ThesisTable theses={filtered} /></div></div>
      </section>
      <ThesisForm open={showForm} onOpenChange={setShowForm} thesis={null} />
    </>
  );
}
