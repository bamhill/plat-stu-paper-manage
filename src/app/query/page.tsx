import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { QueryClient } from "./query-client";

export const dynamic = "force-dynamic";

export default async function QueryPage() {
  const papers = await prisma.paper.findMany({
    include: {
      student: { select: { id: true, name: true, status: true, enrollmentYear: true } },
      submissions: {
        include: { revisions: true },
        orderBy: { submissionRound: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const students = await prisma.student.findMany({
    orderBy: { enrollmentYear: "desc" },
    include: {
      papers: {
        include: {
          submissions: { include: { revisions: true }, orderBy: { submissionRound: "desc" } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  return (
    <div>
      <AppBreadcrumb />
      <h1 className="text-xl font-bold mb-4">综合查询</h1>
      <QueryClient
        papers={serialize(papers)}
        students={serialize(students)}
      />
    </div>
  );
}
