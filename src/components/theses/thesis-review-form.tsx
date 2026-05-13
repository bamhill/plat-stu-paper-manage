"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { thesisReviewSchema, type ThesisReviewFormData } from "@/lib/validators";
import { createThesisReview } from "@/app/theses/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ThesisReviewForm({ open, onOpenChange, thesisId }: { open: boolean; onOpenChange: (o: boolean) => void; thesisId: number }) {
  const form = useForm<ThesisReviewFormData>({
    resolver: zodResolver(thesisReviewSchema),
    defaultValues: {
      thesisId, reviewerName: "", reviewerType: "external",
      score: null, decision: "pass", comments: null, reviewedAt: null,
    },
  });

  async function onSubmit(data: ThesisReviewFormData) {
    try {
      await createThesisReview(data);
      toast.success("审稿意见已添加");
      onOpenChange(false);
      form.reset();
    } catch (e) { toast.error("操作失败"); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>添加审稿意见</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="reviewerName" render={({ field }) => (
                <FormItem><FormLabel>审稿人</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="reviewerType" render={({ field }) => (
                <FormItem><FormLabel>审稿类型</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="internal">校内</SelectItem>
                      <SelectItem value="external">校外</SelectItem>
                      <SelectItem value="anonymous">匿名</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="score" render={({ field }) => (
                <FormItem><FormLabel>分数</FormLabel><FormControl><Input {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="decision" render={({ field }) => (
                <FormItem><FormLabel>决定</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="pass">通过</SelectItem>
                      <SelectItem value="minor_revision">小修</SelectItem>
                      <SelectItem value="major_revision">大修</SelectItem>
                      <SelectItem value="fail">不通过</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="reviewedAt" render={({ field }) => (
                <FormItem><FormLabel>审阅日期</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="comments" render={({ field }) => (
              <FormItem><FormLabel>审稿意见</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} rows={3} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
              <Button type="submit">添加</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
