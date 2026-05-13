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
import { NativeSelect } from "@/components/ui/select";
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
        if (d.degreeTypes?.length) {
          const merged = student && !d.degreeTypes.includes(student.degreeType)
            ? [...d.degreeTypes, student.degreeType]
            : d.degreeTypes;
          setDegreeTypes(merged);
        }
      });
  }, [student]);

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "", studentNo: "", degreeType: "",
      enrollmentYear: new Date().getFullYear(), graduationYear: null,
      direction: "", supervisor: "", coSupervisor: null,
      status: "active", notes: null,
    },
  });

  // Auto-set degree type for new student once options load
  useEffect(() => {
    if (!student && open && degreeTypes.length > 0) {
      const currentVal = form.getValues("degreeType");
      if (!currentVal) form.setValue("degreeType", degreeTypes[0]);
    }
  }, [degreeTypes, student, form, open]);

  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name, studentNo: student.studentNo,
        degreeType: student.degreeType, enrollmentYear: student.enrollmentYear,
        graduationYear: student.graduationYear ?? null,
        direction: student.direction, supervisor: student.supervisor,
        coSupervisor: student.coSupervisor ?? null,
        status: student.status, notes: student.notes ?? null,
      } as StudentFormData);
    } else if (!open) {
      // Reset form when dialog closes
      form.reset({
        name: "", studentNo: "", degreeType: "",
        enrollmentYear: new Date().getFullYear(), graduationYear: null,
        direction: "", supervisor: "", coSupervisor: null,
        status: "active", notes: null,
      });
    }
  }, [student, form, open]);

  async function onSubmit(data: StudentFormData) {
    try {
      if (student) { await updateStudent(student.id, data); toast.success("学生信息已更新"); }
      else { await createStudent(data); toast.success("学生已添加"); }
      onOpenChange(false);
    } catch (e) { toast.error("操作失败，请检查输入"); }
  }

  return (
    <Dialog key={student?.id ?? "new"} open={open} onOpenChange={onOpenChange}>
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
                  <FormControl>
                    <NativeSelect value={field.value || ""} onValueChange={field.onChange}>
                      {degreeTypes.length === 0 && <option value="" disabled>加载中...</option>}
                      {degreeTypes.map((dt) => (
                        <option key={dt} value={dt}>
                          {dt}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormControl><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>状态</FormLabel>
                  <FormControl>
                    <NativeSelect value={field.value || ""} onValueChange={field.onChange}>
                      <option value="active">在读</option><option value="graduated">已毕业</option>
                      <option value="delayed">延期</option><option value="suspended">休学</option>
                    </NativeSelect>
                  </FormControl><FormMessage />
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
