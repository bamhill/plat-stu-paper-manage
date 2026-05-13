import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const submissions = await prisma.submission.findMany({
    select: { id: true, venueName: true, paper: { select: { title: true } } },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json(submissions);
}
