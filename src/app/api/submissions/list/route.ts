import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacher } from "@/lib/auth";

export async function GET() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const submissions = await prisma.submission.findMany({
    where: { paper: { student: { teacherId: teacher.id } } },
    select: { id: true, venueName: true, paper: { select: { title: true } } },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json(submissions);
}
