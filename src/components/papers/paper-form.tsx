"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { paperSchema, type PaperFormData } from "@/lib/validators";
import { createPaper, updatePaper } from "@/app/papers/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type StudentOption = { id: number; name: string };

export function PaperForm({ open, onOpenChange, paper }: { open: boolean; onOpenChange: (o: boolean) => void; paper: any | null }) {
  const [students, setStudents] = useState<StudentOption[]>([]);

  useEffect(() => {
    if (open) fetch("/api/students/list").then(r => r.json()).then(setStudents);
  }, [open]);

  const form = useForm<PaperFormData>({
    resolver: zodResolver(paperSchema),
    defaultValues: {
      studentId: 0, title: "", paperType: "journal", direction: "",
      status: "writing",
      targetVenue: null, versionLabel: null, notes: null, myThoughts: null,
      isPriority: false, priorityOrder: null,
    } as PaperFormData,
  });

  useEffect(() => {
    if (paper) {
      form.reset({
        studentId: paper.studentId, title: paper.title,
        paperType: paper.paperType, direction: paper.direction,
        status: paper.status, targetVenue: paper.targetVenue ?? null,
        currentVersion: paper.currentVersion ?? 1,
        versionLabel: paper.versionLabel ?? null,
        notes: paper.notes ?? null, myThoughts: paper.myThoughts ?? null,
        isPriority: !!paper.isPriority, priorityOrder: paper.priorityOrder ?? null,
      } as PaperFormData);
    }
  }, [paper, form]);

  // Auto-select first student when creating new paper
  useEffect(() => {
    if (!paper && open && students.length > 0) {
      const currentVal = form.getValues("studentId");
      if (!currentVal) form.setValue("studentId", students[0].id);
    }
  }, [students, paper, form, open]);

  async function onSubmit(data: PaperFormData) {
    if (!paper && !data.studentId) {
      toast.error("请选择所属学生");
      return;
    }
    try {
      if (paper) { await updatePaper(paper.id, data); toast.success("小论文已更新"); }
      else { await createPaper(data); toast.success("小论文已创建"); }
      onOpenChange(false);
      form.reset();
    } catch (e) { toast.error("操作失败"); }
  }

  return (
    <Dialog key={paper?.id ?? "new"} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{paper ? "编辑小论文" : "添加小论文"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="studentId" render={({ field }) => (
              <FormItem><FormLabel>所属学生</FormLabel>
                <FormControl>
                  <NativeSelect value={String(field.value ?? "")} onValueChange={(v) => field.onChange(Number(v))}>
                    <option value="" disabled>选择学生</option>
                    {students.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                  </NativeSelect>
                </FormControl><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>标题</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            {paper && (
              <FormField control={form.control} name="versionLabel" render={({ field }) => (
                <FormItem><FormLabel>版本标签</FormLabel><FormControl><Input {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} placeholder="如：V1_202601" /></FormControl><FormMessage /></FormItem>
              )} />
            )}
            {paper && (
              <div className="rounded-md bg-blue-50 border border-blue-100 p-2 text-xs text-blue-700">
                在论文详情页上传和管理各版本的论文文件
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="paperType" render={({ field }) => (
                <FormItem><FormLabel>论文类型</FormLabel>
                  <FormControl>
                    <NativeSelect value={field.value || ""} onValueChange={field.onChange}>
                      <option value="journal">期刊</option><option value="conference">会议</option>
                    </NativeSelect>
                  </FormControl><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>状态</FormLabel>
                  <FormControl>
                    <NativeSelect value={field.value || ""} onValueChange={field.onChange}>
                      <option value="writing">撰写中</option><option value="ready_to_submit">待投稿</option>
                      <option value="submitted">已投稿</option><option value="with_editor">编辑处理中</option><option value="under_review">外审中</option><option value="minor_revision">小修</option>
                      <option value="major_revision">大修</option><option value="accepted">已接收</option>
                      <option value="rejected">已拒稿</option><option value="published">已发表</option>
                    </NativeSelect>
                  </FormControl><FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="direction" render={({ field }) => (
              <FormItem><FormLabel>方向</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="targetVenue" render={({ field }) => (
              <FormItem><FormLabel>目标期刊/会议</FormLabel><FormControl><Input {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="rounded-md border border-slate-200 px-3 py-2.5">
              <FormField control={form.control} name="isPriority" render={({ field }) => (
                <FormItem>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={!!field.value} onChange={e => field.onChange(e.target.checked)} className="rounded" />
                    <span className="font-medium text-slate-700">首页重点跟踪</span>
                  </label>
                </FormItem>
              )} />
              {form.watch("isPriority") && (
                <FormField control={form.control} name="priorityOrder" render={({ field }) => (
                  <FormItem className="mt-2"><FormLabel>显示顺序</FormLabel><FormControl><Input type="number" min={1} {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} placeholder="留空则排在当前重点稿件之后" /></FormControl><FormMessage /></FormItem>
                )} />
              )}
            </div>
            <FormField control={form.control} name="myThoughts" render={({ field }) => (
              <FormItem><FormLabel>我的思考</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} placeholder="导师对这篇论文的判断..." /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>备注</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
              <Button type="submit">{paper ? "保存" : "添加"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
