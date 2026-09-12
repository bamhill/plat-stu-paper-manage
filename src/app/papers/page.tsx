import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { PaperListClient } from "./paper-list-client";
import { getPaperPriorityMeta } from "@/lib/paper-runtime-meta";
import { requireTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PapersPage({ searchParams }: { searchParams?: { status?: string; priority?: string; mode?: string; scope?: string } }) {
  const teacher = await requireTeacher();
  const papers = await prisma.paper.findMany({
    where: { student: { teacherId: teacher.id } },
    include: { student: { select: { name: true, status: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const priorityMeta = getPaperPriorityMeta();
  const papersWithPriority = papers.map((p) => ({ ...p, ...(priorityMeta.get(p.id) || { isPriority: false, priorityOrder: null }) }))
    .sort((a, b) => Number(b.isPriority) - Number(a.isPriority) || ((a.priorityOrder ?? 999) - (b.priorityOrder ?? 999)) || b.updatedAt.getTime() - a.updatedAt.getTime());

  const priority = papersWithPriority.filter((p) => p.isPriority).length;
  const planned = papersWithPriority.filter((p) => p.status === "ready_to_submit").length;
  const inProcess = papersWithPriority.filter((p) => ["submitted", "with_editor", "awaiting_reviewer_assignment", "under_review", "minor_revision", "major_revision"].includes(p.status)).length;
  const accepted = papersWithPriority.filter((p) => ["accepted", "published"].includes(p.status)).length;

  return (
    <div>
      <PageHeader
        title="小论文"
        description="按论文查看状态、投稿轮次、审稿意见与返修进展。"
        stats={[
          { label: "全部小论文", value: papersWithPriority.length, hint: "包含历史论文", href: "/papers" },
          { label: "重点跟踪", value: priority, hint: "最近重点关注", href: "/papers?priority=1" },
          { label: "待投稿", value: planned, hint: "已有明确下一投目标", href: "/papers?status=ready_to_submit" },
          { label: "投稿流程中", value: inProcess, hint: `已接收/发表 ${accepted} 篇`, href: "/papers?mode=process" },
        ]}
      />
      <PaperListClient papers={serialize(papersWithPriority)} initialFilter={searchParams?.status || "全部"} initialPriorityOnly={searchParams?.priority === "1"} initialMode={searchParams?.mode || ""} initialScope={searchParams?.scope || ""} />
    </div>
  );
}
