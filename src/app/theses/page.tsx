import { prisma } from "@/lib/prisma";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { ThesisListClient } from "./thesis-list-client";

export const dynamic = "force-dynamic";

export default async function ThesesPage() {
  const theses = await prisma.thesis.findMany({
    include: { student: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div>
      <AppBreadcrumb />
      <h1 className="text-xl font-bold mb-4">大论文管理</h1>
      <ThesisListClient theses={JSON.parse(JSON.stringify(theses))} />
    </div>
  );
}
