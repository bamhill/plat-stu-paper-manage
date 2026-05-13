import { prisma } from "@/lib/prisma";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { AnalysisClient } from "./analysis-client";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  const revisions = await prisma.revision.findMany({
    include: {
      submission: {
        select: {
          venueName: true,
          submittedAt: true,
          decision: true,
          reviewerComments: true,
          paper: {
            select: {
              id: true,
              title: true,
              student: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { receivedAt: "desc" },
  });

  const students = await prisma.student.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const venues = Array.from(new Set(revisions.map((r) => r.submission?.venueName).filter(Boolean))).sort() as string[];

  return (
    <div>
      <AppBreadcrumb />
      <h1 className="text-xl font-bold mb-4">返修分析</h1>
      <AnalysisClient
        revisions={JSON.parse(JSON.stringify(revisions))}
        students={JSON.parse(JSON.stringify(students))}
        venues={venues}
      />
    </div>
  );
}
