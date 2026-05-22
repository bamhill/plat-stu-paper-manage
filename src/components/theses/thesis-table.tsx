"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteThesis } from "@/app/theses/actions";
import { ThesisForm } from "./thesis-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyTableRow } from "@/components/shared/empty-table-row";
import { TableActions } from "@/components/shared/table-actions";
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
            <TableHead className="w-16">阶段</TableHead><TableHead className="w-16">状态</TableHead>
            <TableHead className="text-center w-14">外审1</TableHead>
            <TableHead className="text-center w-14">外审2</TableHead>
            <TableHead className="text-center w-14">外审3</TableHead>
            <TableHead className="text-center w-14">答辩</TableHead>
            <TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {theses.length === 0 ? (
            <EmptyTableRow colSpan={9} />
          ) : (
            theses.map((t: any) => (
              <TableRow key={t.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/theses/${t.id}`)}>
                <TableCell className="font-medium truncate max-w-[300px]" title={t.title}>{t.title}</TableCell>
                <TableCell className="truncate" title={t.student.name}>{t.student.name}</TableCell>
                <TableCell><StatusBadge value={t.stage} /></TableCell>
                <TableCell><StatusBadge value={t.status} /></TableCell>
                <TableCell className="text-center font-medium text-sm">{t.expert1Score || "-"}</TableCell>
                <TableCell className="text-center font-medium text-sm">{t.expert2Score || "-"}</TableCell>
                <TableCell className="text-center font-medium text-sm">{t.expert3Score || "-"}</TableCell>
                <TableCell className="text-center font-medium text-sm">{t.score || "-"}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <TableActions onEdit={() => setEditTarget(t)} onDelete={() => setDeleteTarget(t)} />
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
