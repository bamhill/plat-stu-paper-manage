import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacher } from "@/lib/auth";

export async function GET() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.promptTemplate.findMany({
    where: { teacherId: teacher.id }, orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const name = String(body.name || "").trim();
  const taskType = String(body.taskType || "custom").trim();
  const templateBody = String(body.body || "").trim();
  if (!name || !templateBody) return NextResponse.json({ error: "模板名称和内容不能为空" }, { status: 400 });
  const row = await prisma.promptTemplate.create({
    data: { teacherId: teacher.id, name, taskType, body: templateBody },
  });
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  const row = await prisma.promptTemplate.findFirst({ where: { id, teacherId: teacher.id } });
  if (!row) return NextResponse.json({ error: "模板不存在" }, { status: 404 });
  await prisma.promptTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
