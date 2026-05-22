import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const relatedType = searchParams.get("relatedType");
  const relatedId = searchParams.get("relatedId");
  if (relatedType && relatedId) {
    const attachments = await prisma.attachment.findMany({
      where: { relatedType, relatedId: Number(relatedId) },
      orderBy: { uploadedAt: "desc" },
    });
    return NextResponse.json(attachments);
  }
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { relatedType, relatedId, fileName, filePath, fileType, fileSize, description } = body;

  if (!relatedType || !relatedId || !fileName || !filePath) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  const attachment = await prisma.attachment.create({
    data: {
      relatedType,
      relatedId: Number(relatedId),
      fileName,
      filePath,
      fileType: fileType || "application/octet-stream",
      fileSize: fileSize || 0,
      description: description || null,
    },
  });

  return NextResponse.json(attachment);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少id" }, { status: 400 });

  const attachment = await prisma.attachment.findUnique({ where: { id: Number(id) } });
  if (!attachment) return NextResponse.json({ error: "附件不存在" }, { status: 404 });

  const { getFilePath } = await import("@/lib/file-utils");
  const fs = await import("fs/promises");
  try { await fs.unlink(getFilePath(attachment.filePath)); } catch {}

  await prisma.attachment.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
