"use client";

import React, { useState } from "react";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { deleteRevision } from "@/app/revisions/actions";
import { RevisionForm } from "./revision-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { AttachmentUpload } from "@/components/shared/attachment-upload";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyTableRow } from "@/components/shared/empty-table-row";
import { TableActions } from "@/components/shared/table-actions";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function RevisionTable({ revisions }: { revisions: any[] }) {
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [expandedAtt, setExpandedAtt] = useState<Set<number>>(new Set());

  function toggleAtt(id: number) {
    const n = new Set(expandedAtt);
    if (n.has(id)) n.delete(id); else n.add(id);
    setExpandedAtt(n);
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>小论文</TableHead><TableHead>学生</TableHead>
            <TableHead>期刊</TableHead><TableHead>轮次</TableHead>
            <TableHead>类型</TableHead><TableHead>截止日期</TableHead>
            <TableHead>状态</TableHead><TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {revisions.length === 0 ? (
            <EmptyTableRow colSpan={8} />
          ) : (
            revisions.map((r: any) => (
              <React.Fragment key={r.id}>
                <TableRow>
                  <TableCell className="font-medium max-w-[180px] truncate" title={r.submission.paper.title}>{r.submission.paper.title}</TableCell>
                  <TableCell className="max-w-[80px] truncate" title={r.submission.paper.student.name}>{r.submission.paper.student.name}</TableCell>
                  <TableCell className="max-w-[160px] truncate" title={r.submission.venueName}>{r.submission.venueName}</TableCell>
                  <TableCell>第{r.revisionRound}轮</TableCell>
                  <TableCell><StatusBadge value={r.revisionType} /></TableCell>
                  <TableCell className="text-gray-500">{formatDate(r.dueAt)}</TableCell>
                  <TableCell><StatusBadge value={r.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <TableActions onEdit={() => setEditTarget(r)} onDelete={() => setDeleteTarget(r)} />
                      <Button variant="ghost" size="icon" onClick={() => toggleAtt(r.id)}><Paperclip className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedAtt.has(r.id) && (
                  <TableRow key={`att-${r.id}`} className="bg-gray-50">
                    <TableCell colSpan={8} className="py-3 px-8">
                      <AttachmentUpload relatedType="revision" relatedId={r.id} existingAttachments={[]} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
      <RevisionForm open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)} revision={editTarget} />
      <ConfirmDelete
        open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="删除返修记录" description="确定删除此返修记录？"
        onConfirm={async () => { if (deleteTarget) { await deleteRevision(deleteTarget.id); toast.success("返修记录已删除"); setDeleteTarget(null); } }}
      />
    </>
  );
}
