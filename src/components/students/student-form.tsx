"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { studentSchema, type StudentFormData } from "@/lib/validators";
import { createStudent, updateStudent } from "@/app/students/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Student {
  id: number; name: string; studentNo: string; degreeType: string;
  enrollmentYear: number; graduationYear: number | null;
  direction: string; supervisor: string; coSupervisor: string | null;
  status: string; notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
}

export function StudentForm({ open, onOpenChange, student }: Props) {
  const [degreeTypes, setDegreeTypes] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.degreeTypes?.length) setDegreeTypes(d.degreeTypes);
      });
  }, []);

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: (student
      ? { ...student, graduationYear: student.graduationYear ?? null, coSupervisor: student.coSupervisor ?? null, notes: student.notes ?? null }
      : { name: "", studentNo: "", degreeType: degreeTypes[0] || "", enrollmentYear: new Date().getFullYear(), graduationYear: null, direction: "", supervisor: "", coSupervisor: null, status: "active", notes: null }) as StudentFormData,
  });

  async function onSubmit(data: StudentFormData) {
    try {
      if (student) { await updateStudent(student.id, data); toast.success("学生信息已更新"); }
      else { await createStudent(data); toast.success("学生已添加"); }
      onOpenChange(false);
      form.reset();
    } catch (e) { toast.error("操作失败，请检查输入"); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{student ? "编辑学生" : "添加学生"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>姓名</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="studentNo" render={({ field }) => (
                <FormItem><FormLabel>学号</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="degreeType" render={({ field }) => (
                <FormItem><FormLabel>学位类型</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {degreeTypes.map((dt) => (
                        <SelectItem key={dt} value={dt}>
                          {dt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>状态</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">在读</SelectItem><SelectItem value="graduated">已毕业</SelectItem>
                      <SelectItem value="delayed">延期</SelectItem><SelectItem value="suspended">休学</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="enrollmentYear" render={({ field }) => (
                <FormItem><FormLabel>入学年份</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="graduationYear" render={({ field }) => (
                <FormItem><FormLabel>毕业年份</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="direction" render={({ field }) => (
              <FormItem><FormLabel>研究方向</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="supervisor" render={({ field }) => (
                <FormItem><FormLabel>导师</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="coSupervisor" render={({ field }) => (
                <FormItem><FormLabel>副导师</FormLabel><FormControl><Input {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>备注</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
              <Button type="submit">{student ? "保存" : "添加"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
