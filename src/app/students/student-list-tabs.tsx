"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentTable } from "@/components/students/student-table";
import { StudentForm } from "@/components/students/student-form";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";

interface Props {
  activeStudents: any[];
  graduatedStudents: any[];
  directions: string[];
  degreeTypes: string[];
}

export function StudentListTabs({ activeStudents, graduatedStudents, directions, degreeTypes }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [dirFilter, setDirFilter] = useState<string>("全部");
  const [degFilter, setDegFilter] = useState<string>("全部");
  const [statusFilter, setStatusFilter] = useState<string>("全部");
  const [settingsDegreeTypes, setSettingsDegreeTypes] = useState<string[]>(degreeTypes);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        if (d.degreeTypes?.length) setSettingsDegreeTypes(d.degreeTypes);
      });
  }, []);

  function filterStudents(students: any[]) {
    return students.filter(s => {
      if (dirFilter !== "全部" && s.direction !== dirFilter) return false;
      if (degFilter !== "全部" && s.degreeType !== degFilter) return false;
      return true;
    });
  }

  const filteredActive = filterStudents(activeStudents);
  const filteredGraduated = filterStudents(graduatedStudents);

  return (
    <>
      <div className="flex gap-4">
        {/* Filter Sidebar */}
        <div className="w-48 shrink-0">
          <div className="rounded-lg border bg-white p-3 space-y-4">
            <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
              <Filter className="h-3.5 w-3.5" />筛选
            </div>

            {/* Status filter */}
            <div>
              <p className="text-xs text-gray-400 mb-1">状态</p>
              <div className="space-y-0.5">
                <button onClick={() => setStatusFilter("全部")} className={`block w-full text-left text-xs px-2 py-1 rounded ${statusFilter === "全部" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
                  全部 ({activeStudents.length + graduatedStudents.length})
                </button>
                <button onClick={() => setStatusFilter("active")} className={`block w-full text-left text-xs px-2 py-1 rounded ${statusFilter === "active" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
                  在读 ({activeStudents.length})
                </button>
                <button onClick={() => setStatusFilter("graduated")} className={`block w-full text-left text-xs px-2 py-1 rounded ${statusFilter === "graduated" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
                  已毕业 ({graduatedStudents.length})
                </button>
              </div>
            </div>

            {/* Direction filter */}
            <div>
              <p className="text-xs text-gray-400 mb-1">研究方向</p>
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                <button onClick={() => setDirFilter("全部")} className={`block w-full text-left text-xs px-2 py-1 rounded ${dirFilter === "全部" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
                  全部 ({activeStudents.length + graduatedStudents.length})
                </button>
                {directions.map(d => {
                  const count = [...activeStudents, ...graduatedStudents].filter(s => s.direction === d).length;
                  return (
                    <button key={d} onClick={() => setDirFilter(d)} className={`block w-full text-left text-xs px-2 py-1 rounded ${dirFilter === d ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
                      {d} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Degree type filter */}
            <div>
              <p className="text-xs text-gray-400 mb-1">学位类型</p>
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                <button onClick={() => setDegFilter("全部")} className={`block w-full text-left text-xs px-2 py-1 rounded ${degFilter === "全部" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
                  全部
                </button>
                {settingsDegreeTypes.map(dt => {
                  const count = [...activeStudents, ...graduatedStudents].filter(s => s.degreeType === dt).length;
                  return (
                    <button key={dt} onClick={() => setDegFilter(dt)} className={`block w-full text-left text-xs px-2 py-1 rounded ${degFilter === dt ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
                      {dt} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="mb-4">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />添加学生
            </Button>
          </div>
          {statusFilter === "全部" ? (
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">在读 ({filteredActive.length})</TabsTrigger>
                <TabsTrigger value="graduated">已毕业 ({filteredGraduated.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="mt-4">
                <StudentTable students={filteredActive} />
              </TabsContent>
              <TabsContent value="graduated" className="mt-4">
                <StudentTable students={filteredGraduated} />
              </TabsContent>
            </Tabs>
          ) : statusFilter === "active" ? (
            <div className="mt-4"><StudentTable students={filteredActive} /></div>
          ) : (
            <div className="mt-4"><StudentTable students={filteredGraduated} /></div>
          )}
        </div>
      </div>
      <StudentForm open={showForm} onOpenChange={setShowForm} student={null} />
    </>
  );
}
