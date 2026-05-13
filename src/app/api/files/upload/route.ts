import { NextRequest, NextResponse } from "next/server";
import { saveFile, validateFile } from "@/lib/file-utils";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const category = formData.get("category") as string;
  const entityId = Number(formData.get("entityId"));
  if (!file || !category || !entityId) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }
  const validation = validateFile(file);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await saveFile(buffer, file.name, category, entityId, file.type);
  return NextResponse.json(result);
}
