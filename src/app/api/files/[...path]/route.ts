import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { getFilePath } from "@/lib/file-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const relPath = params.path.join("/");
  try {
    const fullPath = getFilePath(relPath);
    const buffer = await readFile(fullPath);
    const fileName = params.path[params.path.length - 1];
    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
