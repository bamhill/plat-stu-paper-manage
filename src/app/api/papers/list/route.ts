import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacher } from "@/lib/auth";

export async function GET() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const papers = await prisma.paper.findMany({
    where: { student: { teacherId: teacher.id } },
    select: { id: true, title: true, student: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(papers);
}
