import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const papers = await prisma.paper.findMany({
    select: { id: true, title: true, student: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(papers);
}
