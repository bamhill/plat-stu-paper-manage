import { prisma } from "./prisma";
import { requireTeacher } from "./auth";
import { paperStatusFromSubmission, selectCurrentSubmission } from "./submission-workflow";

export async function syncPaperStatus(paperId: number) {
  const teacher = await requireTeacher();
  const paper = await prisma.paper.findFirst({
    where: { id: paperId, student: { teacherId: teacher.id } },
    include: { submissions: { include: { revisions: { orderBy: { revisionRound: "desc" }, take: 1 } } } },
  });
  if (!paper) return;

  const current = selectCurrentSubmission(paper.submissions, paper.status);
  let next = paperStatusFromSubmission(current, paper.status);
  const latestRev = current?.revisions?.[0];
  if (latestRev && ["pending", "revising"].includes(latestRev.status)) {
    next = latestRev.revisionType === "major" ? "major_revision" : "minor_revision";
  } else if (latestRev?.status === "submitted" && !current?.decision) {
    next = "under_review";
  }

  if (next !== paper.status) await prisma.paper.update({ where: { id: paperId }, data: { status: next } });
}
