import { prisma } from "@/lib/prisma";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { PaperListClient } from "./paper-list-client";

export const dynamic = "force-dynamic";

export default async function PapersPage() {
  const papers = await prisma.paper.findMany({
    include: { student: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div>
      <AppBreadcrumb />
      <h1 className="text-xl font-bold mb-4">小论文管理</h1>
      <PaperListClient papers={JSON.parse(JSON.stringify(papers))} />
    </div>
  );
}
