import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const filePath = path.join(process.cwd(), "data", "files", ...params.path);
  try {
    const buffer = await readFile(filePath);
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
