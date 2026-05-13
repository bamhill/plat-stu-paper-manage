import { prisma } from "@/lib/prisma";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { QueryClient } from "./query-client";

export const dynamic = "force-dynamic";

export default async function QueryPage() {
  const papers = await prisma.paper.findMany({
    include: {
      student: { select: { id: true, name: true, status: true } },
      submissions: {
        include: { revisions: true },
        orderBy: { submissionRound: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <AppBreadcrumb />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">综合查询</h1>
      </div>
      <QueryClient papers={JSON.parse(JSON.stringify(papers))} />
    </div>
  );
}
