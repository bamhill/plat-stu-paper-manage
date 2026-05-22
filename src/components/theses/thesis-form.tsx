"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { thesisSchema, type ThesisFormData } from "@/lib/validators";
import { createThesis, updateThesis } from "@/app/theses/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { AttachmentUpload } from "@/components/shared/attachment-upload";
import { toDateInputValue } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThesisForm({ open, onOpenChange, thesis }: { open: boolean; onOpenChange: (o: boolean) => void; thesis: any | null }) {
  const [students, setStudents] = useState<any[]>([]);
  useEffect(() => { if (open) fetch("/api/students/list").then(r => r.json()).then(setStudents); }, [open]);

  const form = useForm<ThesisFormData>({
    resolver: zodResolver(thesisSchema),
    defaultValues: {
      studentId: 0, title: "", degreeType: "",
      stage: "proposal", proposalDate: null, defenseDate: null,
      score: null, expert1Score: null, expert2Score: null, expert3Score: null,
      reviewComments: null, revisionNotes: null,
      status: "in_progress",
    } as ThesisFormData,
  });

  // Auto-select first student
  useEffect(() => {
    if (!thesis && open && students.length > 0) {
      const currentVal = form.getValues("studentId");
      if (!currentVal) form.setValue("studentId", students[0].id);
    }
  }, [students, thesis, form, open]);

  useEffect(() => {
    if (thesis) {
      form.reset({
        studentId: thesis.studentId, title: thesis.title,
        degreeType: thesis.degreeType, stage: thesis.stage,
        proposalDate: toDateInputValue(thesis.proposalDate),
        defenseDate: toDateInputValue(thesis.defenseDate),
        score: thesis.score ?? null,
        expert1Score: thesis.expert1Score ?? null,
        expert2Score: thesis.expert2Score ?? null,
        expert3Score: thesis.expert3Score ?? null,
        reviewComments: thesis.reviewComments ?? null,
        revisionNotes: thesis.revisionNotes ?? null,
        status: thesis.status,
      } as ThesisFormData);
    }
  }, [thesis, form]);

  async function onSubmit(data: ThesisFormData) {
    if (!thesis && !data.studentId) { toast.error("请选择所属学生"); return; }
    try {
      if (thesis) { await updateThesis(thesis.id, data); toast.success("大论文已更新"); }
      else { await createThesis(data); toast.success("大论文已创建"); }
      onOpenChange(false); form.reset();
    } catch (e) { toast.error("操作失败"); }
  }

  return (
    <Dialog key={thesis?.id ?? "new"} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{thesis ? "编辑大论文" : "添加大论文"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="studentId" render={({ field }) => (
              <FormItem><FormLabel>所属学生</FormLabel>
                <FormControl>
                  <NativeSelect value={String(field.value ?? "")} onValueChange={(v) => field.onChange(Number(v))}>
                    <option value="" disabled>选择学生</option>
                    {students.map((s: any) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                  </NativeSelect>
                </FormControl><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>标题</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="degreeType" render={({ field }) => (
                <FormItem><FormLabel>学位类型</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="stage" render={({ field }) => (
                <FormItem><FormLabel>阶段</FormLabel>
                  <FormControl>
                    <NativeSelect value={field.value || ""} onValueChange={field.onChange}>
                      <option value="proposal">开题</option>
                      <option value="defense">答辩</option>
                    </NativeSelect>
                  </FormControl><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>状态</FormLabel>
                  <FormControl>
                    <NativeSelect value={field.value || ""} onValueChange={field.onChange}>
                      <option value="in_progress">进行中</option><option value="submitted">已提交</option>
                      <option value="reviewed">已审阅</option><option value="revision">修改中</option>
                      <option value="defended">已答辩</option>
                    </NativeSelect>
                  </FormControl><FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="proposalDate" render={({ field }) => (
                <FormItem><FormLabel>开题日期</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="defenseDate" render={({ field }) => (
                <FormItem><FormLabel>答辩日期</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            {/* 外审专家评分 */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">外审专家评分</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="expert1Score" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">专家一分数</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} placeholder="如: 85" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="expert2Score" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">专家二分数</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} placeholder="如: 82" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="expert3Score" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">专家三分数</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} placeholder="如: 78" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* 答辩成绩 */}
            <FormField control={form.control} name="score" render={({ field }) => (
              <FormItem>
                <FormLabel>答辩成绩</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} placeholder="如: 85" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* 附件上传 (for existing thesis) */}
            {thesis && (
              <div className="border-t pt-4 space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">外审专家意见附件</h3>
                  <p className="text-xs text-gray-400 mb-2">上传外审专家的评阅意见书（Word/PDF/压缩包）</p>
                  <AttachmentUpload
                    relatedType="thesis_expert"
                    relatedId={thesis.id}
                    existingAttachments={[]}
                  />
                </div>
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">大论文附件</h3>
                  <p className="text-xs text-gray-400 mb-2">上传大论文终稿、答辩决议等其他文档</p>
                  <AttachmentUpload
                    relatedType="thesis"
                    relatedId={thesis.id}
                    existingAttachments={[]}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
              <Button type="submit">{thesis ? "保存" : "添加"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
