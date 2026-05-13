"use client";

import { useState } from "react";
import { Pencil, Trash2, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteSubmission } from "@/app/submissions/actions";
import { SubmissionForm } from "./submission-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Button } from "@/components/ui/button";
import { RevisionForm } from "@/components/revisions/revision-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SubmissionTable({ submissions }: { submissions: any[] }) {
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [newRevision, setNewRevision] = useState<any | null>(null);

  function toggleExpand(id: number) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-6" />
            <TableHead>小论文</TableHead><TableHead>学生</TableHead>
            <TableHead>投稿期刊/会议</TableHead><TableHead>轮次</TableHead>
            <TableHead>稿件编号</TableHead>
            <TableHead>投稿日期</TableHead><TableHead>决定</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>返修</TableHead>
            <TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow><TableCell colSpan={11} className="text-center text-gray-400 py-8">暂无数据</TableCell></TableRow>
          ) : (
            submissions.map((s: any) => {
              const isExpanded = expanded.has(s.id);
              const hasRevisions = (s.revisions?.length ?? 0) > 0;
              return (
                <>
                  <TableRow key={s.id} className={isExpanded ? "border-b-0" : ""}>
                    <TableCell>
                      {hasRevisions ? (
                        <button onClick={() => toggleExpand(s.id)} className="text-gray-400 hover:text-gray-600">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      ) : (
                        <span className="w-4 inline-block" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-[180px] truncate" title={s.paper.title}>{s.paper.title}</TableCell>
                    <TableCell className="max-w-[80px] truncate" title={s.paper.student.name}>{s.paper.student.name}</TableCell>
                    <TableCell className="max-w-[160px] truncate" title={s.venueName}>{s.venueName}</TableCell>
                    <TableCell className="whitespace-nowrap">第{s.submissionRound}次</TableCell>
                    <TableCell className="max-w-[120px] truncate" title={s.manuscriptNo}>{s.manuscriptNo ?? "-"}</TableCell>
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
                  {/* Submission-level comments */}
                  {isExpanded && (s.reviewerComments || s.editorComments) && (
                    <TableRow className="bg-gray-50 border-b">
                      <TableCell />
                      <TableCell colSpan={10} className="py-2 pl-10">
                        {s.reviewerComments && (
                          <div className="text-sm mb-1">
                            <span className="font-medium text-gray-500">审稿意见：</span>
                            <p className="text-gray-700 whitespace-pre-wrap mt-0.5 bg-white rounded border p-2">{s.reviewerComments}</p>
                          </div>
                        )}
                        {s.editorComments && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-500">编辑意见：</span>
                            <p className="text-gray-700 whitespace-pre-wrap mt-0.5 bg-white rounded border p-2">{s.editorComments}</p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  {/* Expandable revision rows */}
                  {isExpanded && hasRevisions && s.revisions.map((r: any) => (
                    <TableRow key={`rev-${r.id}`} className="bg-gray-50 border-b">
                      <TableCell />
                      <TableCell colSpan={10} className="py-2 pl-10">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-medium">第{r.revisionRound}轮返修</span>
                          <StatusBadge value={r.revisionType} />
                          <StatusBadge value={r.status} />
                          <span className="text-gray-400">
                            收到：{r.receivedAt ? new Date(r.receivedAt).toLocaleDateString("zh-CN") : "-"}
                          </span>
                          <span className="text-gray-400">
                            截止：{r.dueAt ? new Date(r.dueAt).toLocaleDateString("zh-CN") : "-"}
                          </span>
                          <span className="text-gray-400">
                            提交：{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("zh-CN") : "-"}
                          </span>
                        </div>
                        {r.commentsSummary && (
                          <div className="mt-1 text-xs text-gray-500 ml-0 pl-0 border-l-2 border-blue-300 pl-2">
                            {r.commentsSummary}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {isExpanded && (
                    <TableRow key={`rev-actions-${s.id}`} className="bg-gray-50 border-b">
                      <TableCell />
                      <TableCell colSpan={10} className="py-2 pl-10">
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          setNewRevision({ submissionId: s.id, revisionRound: (s.revisions?.length || 0) + 1 });
                        }}>
                          <Plus className="h-3.5 w-3.5 mr-1" />添加返修轮次
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })
          )}
        </TableBody>
      </Table>
      <SubmissionForm open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)} submission={editTarget} />
      <RevisionForm open={!!newRevision} onOpenChange={(o) => !o && setNewRevision(null)} revision={newRevision} />
      <ConfirmDelete
        open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="删除投稿记录" description="确定删除此投稿记录及其返修数据？"
        onConfirm={async () => { if (deleteTarget) { await deleteSubmission(deleteTarget.id); toast.success("投稿记录已删除"); setDeleteTarget(null); } }}
      />
    </>
  );
}
