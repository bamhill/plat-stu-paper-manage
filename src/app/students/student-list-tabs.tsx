"use client";

import { useCallback, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentTable } from "@/components/students/student-table";
import { StudentForm } from "@/components/students/student-form";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search } from "lucide-react";

interface Props {
  activeStudents: any[];
  graduatedStudents: any[];
  degreeTypes: string[];
  initialStatus?: string;
}

export function StudentListTabs({ activeStudents, graduatedStudents, degreeTypes, initialStatus = "全部" }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [degFilter, setDegFilter] = useState<string>("全部");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [keyword, setKeyword] = useState("");

  const filterStudents = useCallback((students: any[]) => {
    const q = keyword.trim().toLowerCase();
    return students.filter((s) => {
      if (degFilter !== "全部" && s.degreeType !== degFilter) return false;
      if (q && ![s.name, s.studentNo, s.direction, s.supervisor, s.degreeType].some((v) => String(v || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [degFilter, keyword]);

  const filteredActive = useMemo(() => filterStudents(activeStudents), [activeStudents, filterStudents]);
  const filteredGraduated = useMemo(() => filterStudents(graduatedStudents), [graduatedStudents, filterStudents]);

  return (
    <>
      <div className="paper-filter-shell">
        <aside className="paper-filter-rail">
          <div className="paper-filter-title"><Filter className="h-3.5 w-3.5" />筛选</div>
          <div className="paper-filter-section">
            <p>培养状态</p>
            <button onClick={() => setStatusFilter("全部")} className={`paper-filter-option ${statusFilter === "全部" ? "paper-filter-option-active" : ""}`}>
              <span>全部</span><span>{activeStudents.length + graduatedStudents.length}</span>
            </button>
            <button onClick={() => setStatusFilter("active")} className={`paper-filter-option ${statusFilter === "active" ? "paper-filter-option-active" : ""}`}>
              <span>在读</span><span>{activeStudents.length}</span>
            </button>
            <button onClick={() => setStatusFilter("graduated")} className={`paper-filter-option ${statusFilter === "graduated" ? "paper-filter-option-active" : ""}`}>
              <span>已毕业</span><span>{graduatedStudents.length}</span>
            </button>
          </div>
          <div className="paper-filter-section">
            <p>学位类型</p>
            <button onClick={() => setDegFilter("全部")} className={`paper-filter-option ${degFilter === "全部" ? "paper-filter-option-active" : ""}`}>
              <span>全部</span>
            </button>
            {degreeTypes.map((dt) => {
              const count = [...activeStudents, ...graduatedStudents].filter((s) => s.degreeType === dt).length;
              return (
                <button key={dt} onClick={() => setDegFilter(dt)} className={`paper-filter-option ${degFilter === dt ? "paper-filter-option-active" : ""}`}>
                  <span>{dt}</span><span>{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="paper-panel">
          <div className="paper-toolbar">
            <div className="paper-toolbar-left">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  className="paper-search-input pl-8"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索姓名、学号、方向或导师"
                />
              </div>
              <span className="paper-muted-note">点击学生进入个人论文推进页</span>
            </div>
            <Button className="paper-primary-button" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />添加学生
            </Button>
          </div>
          <div className="paper-panel-body pt-3">
            {statusFilter === "全部" ? (
              <Tabs defaultValue="active">
                <TabsList>
                  <TabsTrigger value="active">在读 ({filteredActive.length})</TabsTrigger>
                  <TabsTrigger value="graduated">已毕业 ({filteredGraduated.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="mt-3">
                  <div className="paper-table-shell"><StudentTable students={filteredActive} /></div>
                </TabsContent>
                <TabsContent value="graduated" className="mt-3">
                  <div className="paper-table-shell"><StudentTable students={filteredGraduated} /></div>
                </TabsContent>
              </Tabs>
            ) : statusFilter === "active" ? (
              <div className="paper-table-shell"><StudentTable students={filteredActive} /></div>
            ) : (
              <div className="paper-table-shell"><StudentTable students={filteredGraduated} /></div>
            )}
          </div>
        </section>
      </div>
      <StudentForm open={showForm} onOpenChange={setShowForm} student={null} />
    </>
  );
}
