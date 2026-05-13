"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePaper } from "@/app/papers/actions";
import { PaperForm } from "./paper-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "全部", label: "全部状态" },
  { value: "writing", label: "撰写中" },
  { value: "ready_to_submit", label: "待投稿" },
  { value: "submitted", label: "已投稿" },
  { value: "with_editor", label: "编辑处理中" },
  { value: "under_review", label: "外审中" },
  { value: "minor_revision", label: "小修" },
  { value: "major_revision", label: "大修" },
  { value: "accepted", label: "已接收" },
  { value: "rejected", label: "已拒稿" },
  { value: "published", label: "已发表" },
];

export function PaperTable({ papers }: { papers: any[] }) {
  const router = useRouter();
  const [editPaper, setEditPaper] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [filter, setFilter] = useState("全部");

  const filtered = filter === "全部" ? papers : papers.filter((p: any) => p.status === filter);

  return (
    <>
      <div className="mb-4">
        <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>标题</TableHead><TableHead>学生</TableHead><TableHead>类型</TableHead>
            <TableHead>状态</TableHead><TableHead>目标期刊/会议</TableHead>
            <TableHead>版本</TableHead><TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-8">暂无数据</TableCell></TableRow>
          ) : (
            filtered.map((p: any) => (
              <TableRow key={p.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/papers/${p.id}`)}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>{p.student.name}</TableCell>
                <TableCell>{p.paperType === "journal" ? "期刊" : "会议"}</TableCell>
                <TableCell><StatusBadge value={p.status} /></TableCell>
                <TableCell className="text-gray-500">{p.targetVenue ?? "-"}</TableCell>
                <TableCell>{p.versionLabel || `v${p.currentVersion}`}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditPaper(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(p)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
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
