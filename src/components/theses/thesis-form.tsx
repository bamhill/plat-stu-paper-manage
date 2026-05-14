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
      score: null, reviewComments: null, revisionNotes: null,
      status: "in_progress",
    } as ThesisFormData,
  });

  useEffect(() => {
    if (thesis) {
      form.reset({
        studentId: thesis.studentId, title: thesis.title,
        degreeType: thesis.degreeType, stage: thesis.stage,
        proposalDate: thesis.proposalDate?.split("T")[0] ?? null,
        defenseDate: thesis.defenseDate?.split("T")[0] ?? null,
        score: thesis.score ?? null,
        reviewComments: thesis.reviewComments ?? null,
        revisionNotes: thesis.revisionNotes ?? null,
        status: thesis.status,
      } as ThesisFormData);
    }
  }, [thesis, form]);

  async function onSubmit(data: ThesisFormData) {
    try {
      if (thesis) { await updateThesis(thesis.id, data); toast.success("大论文已更新"); }
      else { await createThesis(data); toast.success("大论文已创建"); }
      onOpenChange(false); form.reset();
    } catch (e) { toast.error("操作失败"); }
  }

  return (
    <Dialog key={thesis?.id ?? "new"} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                      <option value="proposal">开题</option><option value="midterm">中期</option>
                      <option value="draft">初稿</option><option value="review">外审</option>
                      <option value="revision">修改</option><option value="defense">答辩</option>
                      <option value="archived">归档</option>
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
