"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { revisionSchema, type RevisionFormData } from "@/lib/validators";
import { createRevision, updateRevision } from "@/app/revisions/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function RevisionForm({ open, onOpenChange, revision }: { open: boolean; onOpenChange: (o: boolean) => void; revision: any | null }) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  useEffect(() => { if (open) fetch("/api/submissions/list").then(r => r.json()).then(setSubmissions); }, [open]);

  const form = useForm<RevisionFormData>({
    resolver: zodResolver(revisionSchema),
    defaultValues: revision ? {
      ...revision,
      receivedAt: revision.receivedAt?.split("T")[0] ?? null,
      dueAt: revision.dueAt?.split("T")[0] ?? null,
      submittedAt: revision.submittedAt?.split("T")[0] ?? null,
      commentsSummary: revision.commentsSummary ?? null,
      responseSummary: revision.responseSummary ?? null,
      notes: revision.notes ?? null,
    } : {
      submissionId: 0, revisionRound: 1,
      receivedAt: null, dueAt: null, submittedAt: null,
      revisionType: "minor", commentsSummary: null, responseSummary: null,
      status: "pending", notes: null,
    },
  });

  async function onSubmit(data: RevisionFormData) {
    try {
      if (revision) { await updateRevision(revision.id, data); toast.success("返修已更新"); }
      else { await createRevision(data); toast.success("返修已记录"); }
      onOpenChange(false); form.reset();
    } catch (e) { toast.error("操作失败"); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{revision ? "编辑返修" : "添加返修"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="submissionId" render={({ field }) => (
              <FormItem><FormLabel>所属投稿</FormLabel>
                <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={field.value ? String(field.value) : undefined}>
                  <FormControl><SelectTrigger><SelectValue placeholder="选择投稿" /></SelectTrigger></FormControl>
                  <SelectContent>{submissions.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.venueName} ({s.paper?.title})</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="revisionRound" render={({ field }) => (
                <FormItem><FormLabel>返修轮次</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="revisionType" render={({ field }) => (
                <FormItem><FormLabel>返修类型</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="minor">小修</SelectItem>
                      <SelectItem value="major">大修</SelectItem>
                      <SelectItem value="resubmit">重投</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>状态</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="pending">待处理</SelectItem>
                      <SelectItem value="revising">返修中</SelectItem>
                      <SelectItem value="submitted">已提交</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="receivedAt" render={({ field }) => (
                <FormItem><FormLabel>收到日期</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="dueAt" render={({ field }) => (
                <FormItem><FormLabel>截止日期</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="submittedAt" render={({ field }) => (
                <FormItem><FormLabel>提交日期</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="commentsSummary" render={({ field }) => (
              <FormItem><FormLabel>审稿意见摘要</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} rows={2} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="responseSummary" render={({ field }) => (
              <FormItem><FormLabel>回复摘要</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} rows={2} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
              <Button type="submit">{revision ? "保存" : "添加"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
