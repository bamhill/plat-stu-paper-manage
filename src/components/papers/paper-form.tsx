"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { paperSchema, type PaperFormData } from "@/lib/validators";
import { createPaper, updatePaper } from "@/app/papers/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    defaultValues: paper
      ? { ...paper, notes: paper.notes ?? null, myThoughts: paper.myThoughts ?? null, targetVenue: paper.targetVenue ?? null }
      : { studentId: 0, title: "", paperType: "journal", direction: "", firstAuthor: "", correspondingAuthor: "", status: "writing", targetVenue: null, notes: null, myThoughts: null },
  });

  async function onSubmit(data: PaperFormData) {
    try {
      if (paper) { await updatePaper(paper.id, data); toast.success("小论文已更新"); }
      else { await createPaper(data); toast.success("小论文已创建"); }
      onOpenChange(false);
      form.reset();
    } catch (e) { toast.error("操作失败"); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{paper ? "编辑小论文" : "添加小论文"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="studentId" render={({ field }) => (
              <FormItem><FormLabel>所属学生</FormLabel>
                <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={field.value ? String(field.value) : undefined}>
                  <FormControl><SelectTrigger><SelectValue placeholder="选择学生" /></SelectTrigger></FormControl>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>标题</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="paperType" render={({ field }) => (
                <FormItem><FormLabel>论文类型</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="journal">期刊</SelectItem><SelectItem value="conference">会议</SelectItem></SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>状态</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="writing">撰写中</SelectItem><SelectItem value="ready_to_submit">待投稿</SelectItem>
                      <SelectItem value="submitted">已投稿</SelectItem><SelectItem value="minor_revision">小修</SelectItem>
                      <SelectItem value="major_revision">大修</SelectItem><SelectItem value="accepted">已接收</SelectItem>
                      <SelectItem value="rejected">已拒稿</SelectItem><SelectItem value="published">已发表</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="direction" render={({ field }) => (
              <FormItem><FormLabel>方向</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstAuthor" render={({ field }) => (
                <FormItem><FormLabel>第一作者</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="correspondingAuthor" render={({ field }) => (
                <FormItem><FormLabel>通讯作者</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="targetVenue" render={({ field }) => (
              <FormItem><FormLabel>目标期刊/会议</FormLabel><FormControl><Input {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
            )} />
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
