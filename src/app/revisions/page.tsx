import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
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
      <RevisionListClient revisions={serialize(revisions)} />
    </div>
  );
}
