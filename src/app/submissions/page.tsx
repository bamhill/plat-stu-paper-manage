import { prisma } from "@/lib/prisma";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { SubmissionListClient } from "./submission-list-client";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    include: {
      paper: { select: { title: true, student: { select: { name: true } } } },
      revisions: true,
    },
    orderBy: { submittedAt: "desc" },
  });
  return (
    <div>
      <AppBreadcrumb />
      <h1 className="text-xl font-bold mb-4">投稿记录</h1>
      <SubmissionListClient submissions={JSON.parse(JSON.stringify(submissions))} />
    </div>
  );
}
