import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const settings = getSettings();
  if (body.fileRootDir !== undefined) settings.fileRootDir = body.fileRootDir;
  if (body.organizeByStudent !== undefined)
    settings.organizeByStudent = body.organizeByStudent;
  if (body.degreeTypes !== undefined) settings.degreeTypes = body.degreeTypes;
  if (body.aiMode !== undefined) settings.aiMode = body.aiMode;
  if (body.aiApiKey !== undefined) settings.aiApiKey = body.aiApiKey;
  if (body.aiApiUrl !== undefined) settings.aiApiUrl = body.aiApiUrl;
  if (body.aiModel !== undefined) settings.aiModel = body.aiModel;
  saveSettings(settings);
  return NextResponse.json(settings);
}
