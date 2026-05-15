"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { revisionSchema, type RevisionFormData } from "@/lib/validators";
import { createRevision, updateRevision } from "@/app/revisions/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AttachmentUpload } from "@/components/shared/attachment-upload";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function RevisionForm({ open, onOpenChange, revision }: { open: boolean; onOpenChange: (o: boolean) => void; revision: any | null }) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const activeId = revision?.id || createdId;

  useEffect(() => { if (open) fetch("/api/submissions/list").then(r => r.json()).then(setSubmissions); }, [open]);

  const form = useForm<RevisionFormData>({
    resolver: zodResolver(revisionSchema),
    defaultValues: {
      submissionId: 0 as unknown as number, revisionRound: 1,
      receivedAt: null, dueAt: null, submittedAt: null,
      revisionType: "minor", commentsSummary: null, responseSummary: null,
      status: "pending", notes: null,
    } as RevisionFormData,
  });

  useEffect(() => {
    if (revision) {
      form.reset({
        submissionId: revision.submissionId, revisionRound: revision.revisionRound,
        receivedAt: revision.receivedAt?.split("T")[0] ?? null,
        dueAt: revision.dueAt?.split("T")[0] ?? null,
        submittedAt: revision.submittedAt?.split("T")[0] ?? null,
        revisionType: revision.revisionType,
        commentsSummary: revision.commentsSummary ?? null,
        responseSummary: revision.responseSummary ?? null,
        status: revision.status, notes: revision.notes ?? null,
      } as RevisionFormData);
    }
  }, [revision, form]);

  useEffect(() => {
    if (!revision && open && submissions.length > 0) {
      const currentVal = form.getValues("submissionId");
      if (!currentVal) form.setValue("submissionId", submissions[0].id);
    }
  }, [submissions, revision, form, open]);

  async function onSubmit(data: RevisionFormData) {
    try {
      if (revision) {
        await updateRevision(revision.id, data);
        toast.success("返修已更新");
        onOpenChange(false);
      } else {
        const result = await createRevision(data);
        setCreatedId(result.id);
        toast.success("返修已记录，可上传附件");
      }
      form.reset();
    } catch (e: any) { toast.error(e?.message || "操作失败"); }
  }

  return (
    <Dialog key={revision?.id ?? "new"} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{revision ? "编辑返修" : activeId ? "返修已创建 — 上传附件" : "添加返修"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {(revision || !activeId) && (
              <>
            <FormField control={form.control} name="submissionId" render={({ field }) => (
              <FormItem><FormLabel>所属投稿</FormLabel>
                <FormControl>
                  <NativeSelect value={String(field.value ?? "")} onValueChange={(v) => field.onChange(Number(v))}>
                    <option value="" disabled>选择投稿</option>
                    {submissions.map((s: any) => <option key={s.id} value={String(s.id)}>{s.venueName} ({s.paper?.title})</option>)}
                  </NativeSelect>
                </FormControl><FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="revisionRound" render={({ field }) => (
                <FormItem><FormLabel>返修轮次</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="revisionType" render={({ field }) => (
                <FormItem><FormLabel>返修类型</FormLabel>
                  <FormControl>
                    <NativeSelect value={field.value || ""} onValueChange={field.onChange}>
                      <option value="minor">小修</option><option value="major">大修</option><option value="resubmit">重投</option>
                    </NativeSelect>
                  </FormControl><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>状态</FormLabel>
                  <FormControl>
                    <NativeSelect value={field.value || ""} onValueChange={field.onChange}>
                      <option value="pending">待处理</option><option value="revising">返修中</option>
                      <option value="submitted">已提交</option><option value="completed">已完成</option>
                    </NativeSelect>
                  </FormControl><FormMessage />
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
              <FormItem><FormLabel>返修结果 / 回复摘要</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} rows={3} placeholder="记录返修后的审稿结果、修改说明等" /></FormControl><FormMessage /></FormItem>
            )} />
              </>
            )}

            {activeId && (
              <div className="border-t pt-4 space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">审稿意见附件</h3>
                  <AttachmentUpload relatedType="revision_review" relatedId={activeId} existingAttachments={[]} />
                </div>
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">修改稿</h3>
                  <AttachmentUpload relatedType="revision_manuscript" relatedId={activeId} existingAttachments={[]} />
                </div>
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">修改说明 / 补充材料</h3>
                  <AttachmentUpload relatedType="revision_supplement" relatedId={activeId} existingAttachments={[]} />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
              {(revision || !activeId) && <Button type="submit">{revision ? "保存" : "添加返修"}</Button>}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
