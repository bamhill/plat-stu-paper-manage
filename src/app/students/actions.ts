"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline";
import { studentSchema } from "@/lib/validators";
import type { StudentFormData } from "@/lib/validators";
import { assertStudentAllowed } from "@/lib/student-policy";
import { requireTeacher } from "@/lib/auth";
import { requireOwnedStudent } from "@/lib/tenant";

export async function createStudent(data: StudentFormData) {
  const teacher = await requireTeacher();
  const parsed = studentSchema.parse(data);
  assertStudentAllowed(parsed.name);
  const student = await prisma.student.create({
    data: {
      teacherId: teacher.id,
      name: parsed.name, studentNo: parsed.studentNo,
      degreeType: parsed.degreeType, enrollmentYear: parsed.enrollmentYear,
      graduationYear: parsed.graduationYear ?? null,
      direction: parsed.direction, supervisor: parsed.supervisor,
      coSupervisor: parsed.coSupervisor ?? null,
      status: parsed.status, showOnDashboard: parsed.showOnDashboard ?? true, notes: parsed.notes ?? null,
    },
  });
  await createTimelineEvent({
    studentId: student.id, relatedType: "student", relatedId: student.id,
    eventType: "student_created", title: `添加学生：${student.name}`,
  });
  revalidatePath("/students");
  return student;
}

export async function updateStudent(id: number, data: StudentFormData) {
  const { teacher } = await requireOwnedStudent(id);
  const parsed = studentSchema.parse(data);
  assertStudentAllowed(parsed.name);
  const student = await prisma.student.update({
    where: { id },
    data: {
      teacherId: teacher.id,
      name: parsed.name, studentNo: parsed.studentNo,
      degreeType: parsed.degreeType, enrollmentYear: parsed.enrollmentYear,
      graduationYear: parsed.graduationYear ?? null,
      direction: parsed.direction, supervisor: parsed.supervisor,
      coSupervisor: parsed.coSupervisor ?? null,
      status: parsed.status, showOnDashboard: parsed.showOnDashboard ?? true, notes: parsed.notes ?? null,
    },
  });
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return student;
}

export async function deleteStudent(id: number) {
  await requireOwnedStudent(id);
  await prisma.student.delete({ where: { id } });
  revalidatePath("/students");
}
