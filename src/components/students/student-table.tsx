"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteStudent } from "@/app/students/actions";
import { StudentForm } from "./student-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DEGREE_LABELS: Record<string, string> = {
  master: "硕士", phd: "博士", joint: "联培", exchange: "交换",
};

type StudentRow = {
  id: number; name: string; studentNo: string; degreeType: string;
  enrollmentYear: number; graduationYear: number | null;
  direction: string; supervisor: string; coSupervisor: string | null;
  status: string; showOnDashboard?: boolean | null; notes: string | null;
  _count?: { papers: number };
};

export function StudentTable({ students }: { students: StudentRow[] }) {
  const router = useRouter();
  const [editStudent, setEditStudent] = useState<StudentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentRow | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>姓名</TableHead>
            <TableHead>学号</TableHead>
            <TableHead>学位</TableHead>
            <TableHead>年级</TableHead>
            <TableHead>方向</TableHead>
            <TableHead>导师</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="w-12 text-center">看板</TableHead>
            <TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center text-gray-400 py-8">暂无数据</TableCell></TableRow>
          ) : (
            students.map((s) => (
              <TableRow key={s.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/students/${s.id}`)}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-gray-500">{s.studentNo}</TableCell>
                <TableCell>{DEGREE_LABELS[s.degreeType] ?? s.degreeType}</TableCell>
                <TableCell>{s.enrollmentYear}级</TableCell>
                <TableCell>{s.direction}</TableCell>
                <TableCell>{s.supervisor}</TableCell>
                <TableCell><StatusBadge value={s.status} /></TableCell>
                <TableCell className="text-center">{s.showOnDashboard !== false ? "✓" : "-"}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditStudent(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(s)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <StudentForm open={!!editStudent} onOpenChange={(o) => !o && setEditStudent(null)} student={editStudent} />

      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="删除学生"
        description={`确定删除「${deleteTarget?.name}」及其所有相关数据？此操作不可恢复。`}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteStudent(deleteTarget.id);
            toast.success("学生已删除");
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}
