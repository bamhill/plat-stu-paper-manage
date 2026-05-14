import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return NextResponse.json({ ok: true });
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
