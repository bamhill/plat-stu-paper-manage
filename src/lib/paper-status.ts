import { prisma } from "./prisma";

// Derive paper status from its latest submission/revision
export async function syncPaperStatus(paperId: number) {
  const paper = await prisma.paper.findUnique({
    where: { id: paperId },
    include: {
      submissions: {
        orderBy: { submissionRound: "desc" },
        take: 1,
        include: {
          revisions: { orderBy: { revisionRound: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!paper) return;

  const latestSub = paper.submissions[0];
  if (!latestSub) return; // No submissions, keep current status

  let newStatus = paper.status;

  // Determine status from latest submission
  if (latestSub.decision) {
    // Decision has been made
    if (latestSub.decision === "accept") newStatus = "accepted";
    else if (latestSub.decision === "reject") newStatus = "rejected";
    else if (latestSub.decision === "minor_revision") newStatus = "minor_revision";
    else if (latestSub.decision === "major_revision") newStatus = "major_revision";
    else if (latestSub.decision === "under_review") newStatus = "under_review";
  } else if (latestSub.status === "under_review") {
    newStatus = "under_review";
  } else if (latestSub.status === "pending") {
    newStatus = "with_editor"; // Submitted but not yet under review
  }

  // If there's a completed revision, the paper is in a different stage
  const latestRev = latestSub.revisions[0];
  if (latestRev) {
    if (latestRev.status === "submitted") {
      // Revision was submitted, paper back under review
      newStatus = "under_review";
    } else if (latestRev.status === "completed") {
      // Revision completed, check if there's a newer submission
      // This means they resubmitted after revision
    }
  }

  // Update paper status if changed
  if (newStatus !== paper.status) {
    await prisma.paper.update({
      where: { id: paperId },
      data: { status: newStatus },
    });
  }
}
