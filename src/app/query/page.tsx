import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { QueryClient } from "./query-client";
import { requireTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function QueryPage() {
  const teacher = await requireTeacher();
  const papers = await prisma.paper.findMany({
    where: { student: { teacherId: teacher.id } },
    include: {
      student: { select: { id: true, name: true, status: true, enrollmentYear: true } },
      submissions: { include: { revisions: true }, orderBy: { submissionRound: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const students = await prisma.student.findMany({
    where: { teacherId: teacher.id },
    orderBy: { enrollmentYear: "desc" },
    include: {
      papers: { include: { submissions: { include: { revisions: true }, orderBy: { submissionRound: "desc" } } }, orderBy: { updatedAt: "desc" } },
    },
  });

  const submissionCount = papers.reduce((n, p) => n + (p.submissions?.length || 0), 0);
  const revisionCount = papers.reduce((n, p) => n + (p.submissions || []).reduce((m, s) => m + (s.revisions?.length || 0), 0), 0);

  return (
    <div>
      <PageHeader
        title="综合查询"
        description="同一份数据可按论文或按学生展开，快速回看投稿轮次、返修和当前状态。"
        stats={[
          { label: "学生", value: students.length, hint: "在读与毕业均可查询", href: "/students" },
          { label: "小论文", value: papers.length, hint: "论文主记录", href: "/papers" },
          { label: "投稿轮次", value: submissionCount, hint: "历史投稿完整保留", href: "/submissions" },
          { label: "返修轮次", value: revisionCount, hint: "与投稿轮次关联", href: "/revisions" },
        ]}
      />
      <section className="paper-panel"><div className="paper-panel-body"><QueryClient papers={serialize(papers)} students={serialize(students)} /></div></section>
    </div>
  );
}
