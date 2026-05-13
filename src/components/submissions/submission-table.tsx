"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteSubmission } from "@/app/submissions/actions";
import { SubmissionForm } from "./submission-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SubmissionTable({ submissions }: { submissions: any[] }) {
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>小论文</TableHead><TableHead>学生</TableHead>
            <TableHead>投稿期刊/会议</TableHead><TableHead>轮次</TableHead>
            <TableHead>投稿日期</TableHead><TableHead>决定</TableHead>
            <TableHead>状态</TableHead><TableHead>返修</TableHead>
            <TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow><TableCell colSpan={9} className="text-center text-gray-400 py-8">暂无数据</TableCell></TableRow>
          ) : (
            submissions.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.paper.title}</TableCell>
                <TableCell>{s.paper.student.name}</TableCell>
                <TableCell>{s.venueName}</TableCell>
                <TableCell>第{s.submissionRound}次</TableCell>
                <TableCell className="text-gray-500">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString("zh-CN") : "-"}</TableCell>
                <TableCell>{s.decision ? <StatusBadge value={s.decision} /> : "-"}</TableCell>
                <TableCell><StatusBadge value={s.status} /></TableCell>
                <TableCell>{s.revisions?.length ?? 0}轮</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditTarget(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(s)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <SubmissionForm open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)} submission={editTarget} />
      <ConfirmDelete
        open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="删除投稿记录" description="确定删除此投稿记录及其返修数据？"
        onConfirm={async () => { if (deleteTarget) { await deleteSubmission(deleteTarget.id); toast.success("投稿记录已删除"); setDeleteTarget(null); } }}
      />
    </>
  );
}
