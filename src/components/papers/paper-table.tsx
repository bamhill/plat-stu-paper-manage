"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deletePaper } from "@/app/papers/actions";
import { PaperForm } from "./paper-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyTableRow } from "@/components/shared/empty-table-row";
import { TableActions } from "@/components/shared/table-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { paperDisplayTitle } from "@/lib/paper-display";



export function PaperTable({ papers }: { papers: any[] }) {
  const router = useRouter();
  const [editPaper, setEditPaper] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  return (
    <>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead>标题</TableHead><TableHead>学生</TableHead><TableHead>类型</TableHead>
            <TableHead>状态</TableHead><TableHead>目标期刊/会议</TableHead>
            <TableHead>版本</TableHead><TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {papers.length === 0 ? (
            <EmptyTableRow colSpan={7} />
          ) : (
            papers.map((p: any) => (
              <TableRow key={p.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/papers/${p.id}`)}>
                <TableCell className="font-medium truncate max-w-[300px]" title={p.title}><span className="inline-flex items-center gap-1.5">{p.isPriority ? <span className="text-amber-500">★</span> : null}{paperDisplayTitle(p.title)}</span></TableCell>
                <TableCell>{p.student.name}</TableCell>
                <TableCell>{p.paperType === "journal" ? "期刊" : "会议"}</TableCell>
                <TableCell><StatusBadge value={p.status} /></TableCell>
                <TableCell className="text-gray-500">{p.targetVenue ?? "-"}</TableCell>
                <TableCell>{p.versionLabel || `v${p.currentVersion}`}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <TableActions onEdit={() => setEditPaper(p)} onDelete={() => setDeleteTarget(p)} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <PaperForm open={!!editPaper} onOpenChange={(o) => !o && setEditPaper(null)} paper={editPaper} />
      <ConfirmDelete
        open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="删除小论文"
        description={`确定删除「${deleteTarget?.title}」及其投稿/返修/版本数据？此操作不可恢复。`}
        onConfirm={async () => { if (deleteTarget) { await deletePaper(deleteTarget.id); toast.success("小论文已删除"); setDeleteTarget(null); } }}
      />
    </>
  );
}
