"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteThesis } from "@/app/theses/actions";
import { ThesisForm } from "./thesis-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ThesisTable({ theses }: { theses: any[] }) {
  const router = useRouter();
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>标题</TableHead><TableHead>学生</TableHead>
            <TableHead>阶段</TableHead><TableHead>状态</TableHead>
            <TableHead>分数</TableHead><TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {theses.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">暂无数据</TableCell></TableRow>
          ) : (
            theses.map((t: any) => (
              <TableRow key={t.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/theses/${t.id}`)}>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell>{t.student.name}</TableCell>
                <TableCell><StatusBadge value={t.stage} /></TableCell>
                <TableCell><StatusBadge value={t.status} /></TableCell>
                <TableCell>{t.score ?? "-"}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditTarget(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(t)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <ThesisForm open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)} thesis={editTarget} />
      <ConfirmDelete
        open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="删除大论文" description="确定删除此大论文及其审稿意见？"
        onConfirm={async () => { if (deleteTarget) { await deleteThesis(deleteTarget.id); toast.success("大论文已删除"); setDeleteTarget(null); } }}
      />
    </>
  );
}
