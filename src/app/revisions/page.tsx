import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { RevisionListClient } from "./revision-list-client";
import { requireTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RevisionsPage({ searchParams }: { searchParams?: { view?: string } }) {
  const teacher = await requireTeacher();
  const revisions = await prisma.revision.findMany({
    where: { submission: { paper: { student: { teacherId: teacher.id } } } },
    include: {
      submission: { select: { venueName: true, paper: { select: { title: true, student: { select: { name: true } } } } } },
    },
    orderBy: [{ dueAt: "asc" }, { receivedAt: "desc" }],
  });

  const now = new Date();
  const pending = revisions.filter((r) => !r.submittedAt && r.status !== "completed");
  const overdue = pending.filter((r) => r.dueAt && new Date(r.dueAt) < now).length;
  const submitted = revisions.filter((r) => !!r.submittedAt || r.status === "completed").length;
  const major = revisions.filter((r) => ["major", "major_revision"].includes(r.revisionType)).length;

  return (
    <div>
      <PageHeader
        title="返修记录"
        description="按截止时间查看返修任务、审稿意见、回复与附件。"
        stats={[
          { label: "返修记录", value: revisions.length, hint: "全部历史轮次", href: "/revisions?view=all" },
          { label: "待完成", value: pending.length, hint: "尚未提交的返修", href: "/revisions?view=pending" },
          { label: "已逾期", value: overdue, hint: "按返修截止日期", href: "/revisions?view=overdue" },
          { label: "已提交", value: submitted, hint: `其中大修 ${major} 轮`, href: "/revisions?view=submitted" },
        ]}
      />
      <RevisionListClient revisions={serialize(revisions)} initialView={searchParams?.view || "all"} />
    </div>
  );
}
