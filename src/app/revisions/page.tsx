import { prisma } from "@/lib/prisma";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { RevisionListClient } from "./revision-list-client";

export const dynamic = "force-dynamic";

export default async function RevisionsPage() {
  const revisions = await prisma.revision.findMany({
    include: {
      submission: { select: { venueName: true, paper: { select: { title: true, student: { select: { name: true } } } } } },
    },
    orderBy: { receivedAt: "desc" },
  });
  return (
    <div>
      <AppBreadcrumb />
      <h1 className="text-xl font-bold mb-4">返修记录</h1>
      <RevisionListClient revisions={JSON.parse(JSON.stringify(revisions))} />
    </div>
  );
}
