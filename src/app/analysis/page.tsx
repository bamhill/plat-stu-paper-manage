import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { AnalysisClient } from "./analysis-client";
import { requireTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  const teacher = await requireTeacher();
  const revisions = await prisma.revision.findMany({
    where: { submission: { paper: { student: { teacherId: teacher.id } } } },
    include: {
      submission: {
        select: {
          venueName: true,
          submittedAt: true,
          decision: true,
          reviewerComments: true,
          paper: { select: { id: true, title: true, student: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: { receivedAt: "desc" },
  });

  const students = await prisma.student.findMany({ where: { teacherId: teacher.id }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  const venues = Array.from(new Set(revisions.map((r) => r.submission?.venueName).filter(Boolean))).sort() as string[];
  const major = revisions.filter((r) => ["major", "major_revision"].includes(r.revisionType)).length;
  const minor = revisions.filter((r) => ["minor", "minor_revision"].includes(r.revisionType)).length;
  const completed = revisions.filter((r) => !!r.submittedAt || r.status === "completed").length;

  return (
    <div>
      <PageHeader
        title="返修分析"
        description="回看返修轮次、审稿主题，以及不同期刊和学生的返修经验。"
        stats={[
          { label: "返修轮次", value: revisions.length, hint: `涉及 ${venues.length} 个期刊/会议`, href: "/revisions?view=all" },
          { label: "大修", value: major, hint: "Major Revision", href: "/revisions?view=major" },
          { label: "小修", value: minor, hint: "Minor Revision", href: "/revisions?view=minor" },
          { label: "已完成", value: completed, hint: "已提交或已完成", href: "/revisions?view=submitted" },
        ]}
      />
      <section className="paper-panel"><div className="paper-panel-body"><AnalysisClient revisions={serialize(revisions) as any} students={serialize(students)} venues={venues} /></div></section>
    </div>
  );
}
