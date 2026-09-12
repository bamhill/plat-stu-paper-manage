import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { getFilePath } from "@/lib/file-utils";
import { getCurrentTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const relPath = params.path.join("/");

  const attachment = await prisma.attachment.findFirst({ where: { teacherId: teacher.id, filePath: relPath }, select: { fileName: true } });
  const paperVersion = attachment ? null : await prisma.paperVersion.findFirst({
    where: { filePath: relPath, paper: { student: { teacherId: teacher.id } } },
    select: { fileName: true },
  });
  const owned = attachment || paperVersion;
  if (!owned) return NextResponse.json({ error: "File not found" }, { status: 404 });

  try {
    const fullPath = await getFilePath(teacher.id, relPath);
    const buffer = await readFile(fullPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(owned.fileName)}`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
