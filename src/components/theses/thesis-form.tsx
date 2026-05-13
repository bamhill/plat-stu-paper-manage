"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { thesisSchema, type ThesisFormData } from "@/lib/validators";
import { createThesis, updateThesis } from "@/app/theses/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThesisForm({ open, onOpenChange, thesis }: { open: boolean; onOpenChange: (o: boolean) => void; thesis: any | null }) {
  const [students, setStudents] = useState<any[]>([]);
  useEffect(() => { if (open) fetch("/api/students/list").then(r => r.json()).then(setStudents); }, [open]);

  const form = useForm<ThesisFormData>({
    resolver: zodResolver(thesisSchema),
    defaultValues: thesis ? {
      ...thesis,
      proposalDate: thesis.proposalDate?.split("T")[0] ?? null,
      midtermDate: thesis.midtermDate?.split("T")[0] ?? null,
      submittedAt: thesis.submittedAt?.split("T")[0] ?? null,
      reviewedAt: thesis.reviewedAt?.split("T")[0] ?? null,
      defenseDate: thesis.defenseDate?.split("T")[0] ?? null,
      score: thesis.score ?? null,
      reviewComments: thesis.reviewComments ?? null,
      revisionNotes: thesis.revisionNotes ?? null,
    } : {
      studentId: 0, title: "", degreeType: "master", stage: "proposal",
      proposalDate: null, midtermDate: null, submittedAt: null,
      reviewedAt: null, defenseDate: null,
      score: null, reviewComments: null, revisionNotes: null,
      status: "in_progress",
    },
  });

  async function onSubmit(data: ThesisFormData) {
    try {
      if (thesis) { await updateThesis(thesis.id, data); toast.success("大论文已更新"); }
      else { await createThesis(data); toast.success("大论文已创建"); }
      onOpenChange(false); form.reset();
    } catch (e) { toast.error("操作失败"); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{thesis ? "编辑大论文" : "添加大论文"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="studentId" render={({ field }) => (
              <FormItem><FormLabel>所属学生</FormLabel>
                <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={field.value ? String(field.value) : undefined}>
                  <FormControl><SelectTrigger><SelectValue placeholder="选择学生" /></SelectTrigger></FormControl>
                  <SelectContent>{students.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="proposal">开题</SelectItem><SelectItem value="midterm">中期</SelectItem>
                      <SelectItem value="draft">初稿</SelectItem><SelectItem value="review">外审</SelectItem>
                      <SelectItem value="revision">修改</SelectItem><SelectItem value="defense">答辩</SelectItem>
                      <SelectItem value="archived">归档</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>状态</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="in_progress">进行中</SelectItem><SelectItem value="submitted">已提交</SelectItem>
                      <SelectItem value="reviewed">已审阅</SelectItem><SelectItem value="revision">修改中</SelectItem>
                      <SelectItem value="defended">已答辩</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="proposalDate" render={({ field }) => (
                <FormItem><FormLabel>开题日期</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="midtermDate" render={({ field }) => (
                <FormItem><FormLabel>中期日期</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="defenseDate" render={({ field }) => (
                <FormItem><FormLabel>答辩日期</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="score" render={({ field }) => (
              <FormItem><FormLabel>分数</FormLabel><FormControl><Input {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="reviewComments" render={({ field }) => (
              <FormItem><FormLabel>评语</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
            )} />
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
