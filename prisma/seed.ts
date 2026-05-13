import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data in correct order (respect FK constraints)
  await prisma.timelineEvent.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.thesisReview.deleteMany();
  await prisma.revision.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.paperVersion.deleteMany();
  await prisma.paper.deleteMany();
  await prisma.thesis.deleteMany();
  await prisma.student.deleteMany();

  // Students
  const s1 = await prisma.student.create({
    data: {
      name: "张三",
      studentNo: "2024001",
      degreeType: "master",
      enrollmentYear: 2024,
      direction: "自然语言处理",
      supervisor: "王教授",
      status: "active",
    },
  });

  const s2 = await prisma.student.create({
    data: {
      name: "李四",
      studentNo: "2023001",
      degreeType: "phd",
      enrollmentYear: 2023,
      direction: "计算机视觉",
      supervisor: "王教授",
      status: "active",
    },
  });

  const s3 = await prisma.student.create({
    data: {
      name: "王五",
      studentNo: "2022001",
      degreeType: "master",
      enrollmentYear: 2022,
      graduationYear: 2025,
      direction: "数据挖掘",
      supervisor: "陈教授",
      status: "graduated",
    },
  });

  // Papers
  const p1 = await prisma.paper.create({
    data: {
      studentId: s1.id,
      title: "基于Transformer的文本分类研究",
      paperType: "journal",
      direction: "NLP",
      firstAuthor: "张三",
      correspondingAuthor: "王教授",
      status: "submitted",
      targetVenue: "ACL 2026",
      currentVersion: 2,
      myThoughts: "方法有创新性，但实验对比不够充分",
    },
  });

  await prisma.paperVersion.create({
    data: {
      paperId: p1.id,
      versionNumber: 1,
      fileName: "draft_v1.docx",
      filePath: "papers/p1_v1_20260101_draft_v1.docx",
      fileSize: 1024000,
      description: "初稿",
    },
  });

  await prisma.paperVersion.create({
    data: {
      paperId: p1.id,
      versionNumber: 2,
      fileName: "submission_v2.docx",
      filePath: "papers/p1_v2_20260301_submission_v2.docx",
      fileSize: 1150000,
      description: "投稿版本",
    },
  });

  const p2 = await prisma.paper.create({
    data: {
      studentId: s2.id,
      title: "高效图像分割算法",
      paperType: "conference",
      direction: "CV",
      firstAuthor: "李四",
      correspondingAuthor: "李四",
      status: "minor_revision",
      targetVenue: "CVPR 2026",
      currentVersion: 3,
    },
  });

  const p3 = await prisma.paper.create({
    data: {
      studentId: s3.id,
      title: "基于图神经网络的推荐系统",
      paperType: "journal",
      direction: "数据挖掘",
      firstAuthor: "王五",
      correspondingAuthor: "陈教授",
      status: "published",
      targetVenue: "TKDE",
      currentVersion: 4,
    },
  });

  // Submissions
  const sub1 = await prisma.submission.create({
    data: {
      paperId: p1.id,
      venueName: "ACL 2026",
      submissionRound: 1,
      submittedAt: new Date("2026-03-01"),
      status: "under_review",
    },
  });

  const sub2 = await prisma.submission.create({
    data: {
      paperId: p2.id,
      venueName: "CVPR 2026",
      submissionRound: 1,
      submittedAt: new Date("2026-02-15"),
      decisionAt: new Date("2026-04-10"),
      decision: "minor_revision",
      reviewerComments: "实验部分需要补充消融实验，图表质量需要提升。",
      status: "decisioned",
    },
  });

  const sub3 = await prisma.submission.create({
    data: {
      paperId: p3.id,
      venueName: "TKDE",
      submissionRound: 1,
      submittedAt: new Date("2025-03-01"),
      decisionAt: new Date("2025-06-15"),
      decision: "major_revision",
      reviewerComments: "需要补充更多baseline对比。",
      status: "decisioned",
    },
  });

  const sub4 = await prisma.submission.create({
    data: {
      paperId: p3.id,
      venueName: "TKDE",
      submissionRound: 2,
      submittedAt: new Date("2025-09-01"),
      decisionAt: new Date("2025-11-01"),
      decision: "accept",
      reviewerComments: "修改充分，接收。",
      status: "decisioned",
    },
  });

  // Revisions
  await prisma.revision.create({
    data: {
      submissionId: sub2.id,
      revisionRound: 1,
      receivedAt: new Date("2026-04-10"),
      dueAt: new Date("2026-06-10"),
      revisionType: "minor",
      commentsSummary: "三点修改意见：1.补充消融实验 2.图表质量 3.文献综述补充",
      status: "revising",
    },
  });

  await prisma.revision.create({
    data: {
      submissionId: sub3.id,
      revisionRound: 1,
      receivedAt: new Date("2025-06-15"),
      submittedAt: new Date("2025-08-15"),
      revisionType: "major",
      status: "completed",
    },
  });

  // Theses
  const thesis1 = await prisma.thesis.create({
    data: {
      studentId: s3.id,
      title: "基于图神经网络的推荐系统研究",
      degreeType: "master",
      stage: "defense",
      proposalDate: new Date("2024-06-01"),
      midtermDate: new Date("2024-12-01"),
      submittedAt: new Date("2025-04-01"),
      reviewedAt: new Date("2025-05-15"),
      defenseDate: new Date("2025-06-01"),
      score: "85",
      status: "defended",
    },
  });

  // Thesis reviews
  await prisma.thesisReview.create({
    data: {
      thesisId: thesis1.id,
      reviewerName: "赵教授",
      reviewerType: "external",
      score: "82",
      decision: "minor_revision",
      comments: "论文整体结构合理，实验充分。建议在第三章补充复杂度分析。",
      reviewedAt: new Date("2025-05-15"),
    },
  });

  // Timeline events
  await prisma.timelineEvent.createMany({
    data: [
      {
        studentId: s1.id,
        relatedType: "paper",
        relatedId: p1.id,
        eventType: "paper_created",
        title: "创建小论文：基于Transformer的文本分类研究",
        eventDate: new Date("2026-01-15"),
      },
      {
        studentId: s1.id,
        relatedType: "submission",
        relatedId: sub1.id,
        eventType: "paper_submitted",
        title: "投稿至 ACL 2026",
        eventDate: new Date("2026-03-01"),
      },
      {
        studentId: s2.id,
        relatedType: "paper",
        relatedId: p2.id,
        eventType: "paper_created",
        title: "创建小论文：高效图像分割算法",
        eventDate: new Date("2025-11-01"),
      },
      {
        studentId: s2.id,
        relatedType: "submission",
        relatedId: sub2.id,
        eventType: "decision_received",
        title: "CVPR 2026 审稿意见返回：Minor Revision",
        description: "三点修改意见",
        eventDate: new Date("2026-04-10"),
      },
      {
        studentId: s3.id,
        relatedType: "submission",
        relatedId: sub4.id,
        eventType: "paper_accepted",
        title: "TKDE 接收",
        eventDate: new Date("2025-11-01"),
      },
      {
        studentId: s3.id,
        relatedType: "thesis",
        relatedId: thesis1.id,
        eventType: "thesis_defended",
        title: "大论文答辩通过，成绩85分",
        eventDate: new Date("2025-06-01"),
      },
    ],
  });

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
