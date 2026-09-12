import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacher } from "@/lib/auth";

export async function GET() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const students = await prisma.student.findMany({
    where: { teacherId: teacher.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(students);
}
