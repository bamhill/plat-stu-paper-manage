import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings";
import { getCurrentTeacher } from "@/lib/auth";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return unauthorized();
  return NextResponse.json(await getSettings(teacher.id));
}

export async function PUT(req: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return unauthorized();
  const body = await req.json();
  const settings = await getSettings(teacher.id);
  if (body.fileRootDir !== undefined) settings.fileRootDir = body.fileRootDir;
  if (body.organizeByStudent !== undefined) settings.organizeByStudent = body.organizeByStudent;
  if (body.degreeTypes !== undefined) settings.degreeTypes = body.degreeTypes;
  if (body.aiPackageDefaults !== undefined) settings.aiPackageDefaults = { ...settings.aiPackageDefaults, ...body.aiPackageDefaults };
  await saveSettings(teacher.id, settings);
  return NextResponse.json(settings);
}
