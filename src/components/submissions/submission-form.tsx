"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { submissionSchema, type SubmissionFormData } from "@/lib/validators";
import { createSubmission, updateSubmission } from "@/app/submissions/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function SubmissionForm({ open, onOpenChange, submission }: { open: boolean; onOpenChange: (o: boolean) => void; submission: any | null }) {
  const [papers, setPapers] = useState<any[]>([]);
  useEffect(() => { if (open) fetch("/api/papers/list").then(r => r.json()).then(setPapers); }, [open]);

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      paperId: 0, venueName: "", submissionRound: 1,
      submittedAt: null, decisionAt: null, decision: null,
      editorComments: null, reviewerComments: null,
      status: "pending", notes: null,
    } as SubmissionFormData,
  });

  useEffect(() => {
    if (submission) {
      form.reset({
        paperId: submission.paperId, venueName: submission.venueName,
        submissionRound: submission.submissionRound,
        submittedAt: submission.submittedAt?.split("T")[0] ?? null,
        decisionAt: submission.decisionAt?.split("T")[0] ?? null,
        decision: submission.decision ?? null,
        editorComments: submission.editorComments ?? null,
        reviewerComments: submission.reviewerComments ?? null,
        status: submission.status, notes: submission.notes ?? null,
      } as SubmissionFormData);
    }
  }, [submission, form]);

  async function onSubmit(data: SubmissionFormData) {
    try {
      if (submission) { await updateSubmission(submission.id, data); toast.success("投稿已更新"); }
      else { await createSubmission(data); toast.success("投稿已记录"); }
      onOpenChange(false); form.reset();
    } catch (e) { toast.error("操作失败"); }
  }

  return (
    <Dialog key={submission?.id ?? "new"} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{submission ? "编辑投稿" : "添加投稿"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="paperId" render={({ field }) => (
              <FormItem><FormLabel>小论文</FormLabel>
                <FormControl>
                  <NativeSelect value={String(field.value ?? "")} onValueChange={(v) => field.onChange(Number(v))}>
                    <option value="" disabled>选择论文</option>
                    {papers.map((p: any) => <option key={p.id} value={String(p.id)}>{p.title} ({p.student?.name})</option>)}
                  </NativeSelect>
                </FormControl><FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="venueName" render={({ field }) => (
                <FormItem><FormLabel>期刊/会议名</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="submissionRound" render={({ field }) => (
                <FormItem><FormLabel>投稿轮次</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="submittedAt" render={({ field }) => (
                <FormItem><FormLabel>投稿日期</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="decisionAt" render={({ field }) => (
                <FormItem><FormLabel>决定日期</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>状态</FormLabel>
                  <FormControl>
                    <NativeSelect value={field.value || ""} onValueChange={field.onChange}>
                      <option value="pending">待处理</option>
                      <option value="under_review">审稿中</option>
                      <option value="decisioned">已返回</option>
                    </NativeSelect>
                  </FormControl><FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="decision" render={({ field }) => (
              <FormItem><FormLabel>审稿决定</FormLabel>
                <FormControl>
                  <NativeSelect value={field.value ?? ""} onValueChange={field.onChange}>
                    <option value="" disabled>未决定</option>
                    <option value="under_review">审稿中</option>
                    <option value="minor_revision">小修</option>
                    <option value="major_revision">大修</option>
                    <option value="accept">接收</option>
                    <option value="reject">拒稿</option>
                  </NativeSelect>
                </FormControl><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="reviewerComments" render={({ field }) => (
              <FormItem><FormLabel>审稿意见</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} rows={3} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="editorComments" render={({ field }) => (
              <FormItem><FormLabel>编辑意见</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
              <Button type="submit">{submission ? "保存" : "添加"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
