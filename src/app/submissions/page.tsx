import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { SubmissionListClient } from "./submission-list-client";
import { getSubmissionManuscriptMetaMap } from "@/lib/submission-manuscript-meta";
import { requireTeacher } from "@/lib/auth";
import { selectCurrentSubmission } from "@/lib/submission-workflow";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage({ searchParams }: { searchParams?: { new?: string; paperId?: string; venue?: string; edit?: string; view?: string } }) {
  const teacher = await requireTeacher();
  const submissions = await prisma.submission.findMany({
    where: { paper: { student: { teacherId: teacher.id } } },
    include: {
      paper: { select: { id: true, title: true, status: true, targetVenue: true, student: { select: { name: true } } } },
      revisions: true,
    },
    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
  });

  const manuscriptMeta = getSubmissionManuscriptMetaMap(submissions.map((s) => s.id));
  const submissionsWithMeta = submissions.map((s) => ({ ...s, ...(manuscriptMeta.get(s.id) || {}) }));
  const year = new Date().getFullYear();
  const thisYear = submissions.filter((s) => s.submittedAt && new Date(s.submittedAt).getFullYear() === year).length;

  const byPaper = new Map<number, any[]>();
  for (const sub of submissions as any[]) {
    const list = byPaper.get(sub.paperId) || [];
    list.push(sub);
    byPaper.set(sub.paperId, list);
  }
  const currentSubmissionIds = new Set<number>();
  for (const list of Array.from(byPaper.values())) {
    const current = selectCurrentSubmission(list, list[0]?.paper?.status);
    if (current) currentSubmissionIds.add(current.id);
  }
  const activePaperStatuses = new Set(["submitted", "with_editor", "awaiting_reviewer_assignment", "under_review", "minor_revision", "major_revision"]);
  const active = submissions.filter((s) => currentSubmissionIds.has(s.id) && activePaperStatuses.has(s.paper.status)).length;
  const accepted = submissions.filter((s) => s.decision === "accept").length;
  const withRevision = submissions.filter((s) => (s.revisions?.length || 0) > 0).length;

  return (
    <div>
      <PageHeader
        title="投稿记录"
        description="逐次查看投稿、决定与返修进展。"
        stats={[
          { label: "投稿记录", value: submissions.length, hint: "全部投稿轮次", href: "/submissions?view=all" },
          { label: `${year} 年投稿`, value: thisYear, hint: "按实际投稿日期", href: "/submissions?view=year" },
          { label: "流程处理中", value: active, hint: "已投稿/编辑/分配审稿人/外审/返修", href: "/submissions?view=active" },
          { label: "发生返修", value: withRevision, hint: `累计录用 ${accepted} 次`, href: "/submissions?view=revision" },
        ]}
      />
      <SubmissionListClient
        submissions={serialize(submissionsWithMeta)}
        currentSubmissionIds={Array.from(currentSubmissionIds)}
        initialNewPaperId={searchParams?.new === "1" ? Number(searchParams?.paperId || 0) || null : null}
        initialVenue={searchParams?.venue || ""}
        initialEditSubmissionId={Number(searchParams?.edit || 0) || null}
        initialView={searchParams?.view || "all"}
        year={year}
      />
    </div>
  );
}
