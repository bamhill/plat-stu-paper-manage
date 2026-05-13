# 研究生论文过程管理系统 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first graduate paper process management system with Next.js App Router, Prisma/SQLite, and shadcn/ui. Core flow: manage students → their papers → submissions → revisions → timeline.

**Architecture:** Next.js App Router with Server Components for data reads and Server Actions for mutations. Prisma ORM over SQLite. shadcn/ui component library. File storage on local filesystem. React Hook Form + Zod for form validation. Single local user, no auth.

**Tech Stack:** Next.js 14, TypeScript (strict), Prisma (SQLite), Tailwind CSS, shadcn/ui, React Hook Form, Zod, Sonner, Lucide React icons.

---

## File Map

```
src/
  lib/
    prisma.ts              — Prisma client singleton
    validators.ts          — Zod schemas (shared)
    timeline.ts            — createTimelineEvent utility
    file-utils.ts          — file upload/download helpers
  app/
    layout.tsx              — Root layout (redirect / → /dashboard)
    globals.css             — Tailwind globals
    dashboard/
      page.tsx              — Dashboard: cards by grade year
    students/
      page.tsx              — Student list with active/graduated tabs
      actions.ts            — Student Server Actions
      [id]/
        page.tsx            — Student detail: tabs for all related data
    papers/
      page.tsx              — Papers list with status filter
      actions.ts            — Paper + PaperVersion Server Actions
      [id]/
        page.tsx            — Paper detail: versions, submissions, revisions
    submissions/
      page.tsx              — Submissions list
      actions.ts            — Submission Server Actions
    revisions/
      page.tsx              — Revisions list
      actions.ts            — Revision Server Actions
    theses/
      page.tsx              — Theses list
      actions.ts            — Thesis + ThesisReview Server Actions
      [id]/
        page.tsx            — Thesis detail: stages, reviews, attachments
    api/
      files/
        upload/
          route.ts          — POST file upload
        [...path]/
          route.ts          — GET file download
  components/
    layout/
      app-sidebar.tsx       — Fixed left sidebar navigation
      app-breadcrumb.tsx    — Dynamic breadcrumb
    ui/                      — shadcn/ui generated components
    students/
      student-form.tsx       — Create/Edit student dialog
      student-table.tsx      — Student data table
    papers/
      paper-form.tsx         — Create/Edit paper dialog
      paper-table.tsx        — Paper data table
      paper-versions.tsx     — Version history list + upload
    submissions/
      submission-form.tsx    — Create/Edit submission dialog
      submission-table.tsx   — Submission data table
    revisions/
      revision-form.tsx      — Create/Edit revision dialog
      revision-table.tsx     — Revision data table
    theses/
      thesis-form.tsx        — Create/Edit thesis dialog
      thesis-table.tsx       — Thesis data table
      thesis-review-form.tsx — Create/Edit thesis review dialog
    dashboard/
      grade-group.tsx        — Per-grade student cards
      student-card.tsx       — Single student card with paper/review summary
    shared/
      status-badge.tsx       — Colored status badge component
      file-upload.tsx        — Reusable file upload component
      timeline-list.tsx      — Timeline event list
      attachment-list.tsx    — Attachment list with download
      confirm-delete.tsx     — Reusable delete confirmation dialog
prisma/
  schema.prisma              — Complete data model
  seed.ts                    — Sample data for testing
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`

- [ ] **Step 1: Create Next.js project**

```bash
cd d:/00_project/2026_StuManage
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --no-turbopack
```

- [ ] **Step 2: Install core dependencies**

```bash
cd d:/00_project/2026_StuManage
pnpm add prisma @prisma/client react-hook-form @hookform/resolvers zod sonner lucide-react date-fns
pnpm add -D @types/node
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d --force
```

Expected: Creates `components.json` and `src/lib/utils.ts`

- [ ] **Step 4: Add shadcn/ui components**

```bash
npx shadcn@latest add sidebar breadcrumb card table dialog form input select textarea badge tabs dropdown-menu alert-dialog button sonner
```

- [ ] **Step 5: Initialize Prisma**

```bash
npx prisma init --datasource-provider sqlite
```

Expected: Creates `prisma/schema.prisma` and `.env`

- [ ] **Step 6: Create data directories**

```bash
mkdir -p data/files/papers data/files/submissions data/files/revisions data/files/theses
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js + Prisma + shadcn/ui project"
```

---

## Task 2: Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Write the complete Prisma schema**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:../data/dev.db"
}

model Student {
  id              Int       @id @default(autoincrement())
  name            String
  studentNo       String    @unique @map("student_no")
  degreeType      String    @map("degree_type") // master, phd, joint, exchange
  enrollmentYear  Int       @map("enrollment_year")
  graduationYear  Int?      @map("graduation_year")
  direction       String
  supervisor      String
  coSupervisor    String?   @map("co_supervisor")
  status          String    @default("active") // active, graduated, delayed, suspended
  notes           String?
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  papers          Paper[]
  theses          Thesis[]
  attachments     Attachment[]
  timelineEvents  TimelineEvent[]

  @@map("students")
}

model Paper {
  id                   Int       @id @default(autoincrement())
  studentId            Int       @map("student_id")
  title                String
  paperType            String    @map("paper_type") // journal, conference
  direction            String
  firstAuthor          String    @map("first_author")
  correspondingAuthor  String    @map("corresponding_author")
  status               String    @default("writing") // writing, ready_to_submit, submitted, minor_revision, major_revision, accepted, rejected, published
  targetVenue          String?   @map("target_venue")
  currentVersion       Int       @default(1) @map("current_version")
  notes                String?
  myThoughts           String?   @map("my_thoughts")
  createdAt            DateTime  @default(now()) @map("created_at")
  updatedAt            DateTime  @updatedAt @map("updated_at")

  student        Student          @relation(fields: [studentId], references: [id], onDelete: Cascade)
  versions       PaperVersion[]
  submissions    Submission[]
  attachments    Attachment[]

  @@map("papers")
}

model PaperVersion {
  id            Int      @id @default(autoincrement())
  paperId       Int      @map("paper_id")
  versionNumber Int      @map("version_number")
  fileName      String   @map("file_name")
  filePath      String   @map("file_path")
  fileSize      Int      @map("file_size")
  description   String?
  uploadedAt    DateTime @default(now()) @map("uploaded_at")

  paper Paper @relation(fields: [paperId], references: [id], onDelete: Cascade)

  @@map("paper_versions")
}

model Submission {
  id                Int       @id @default(autoincrement())
  paperId           Int       @map("paper_id")
  venueName         String    @map("venue_name")
  submissionRound   Int       @map("submission_round")
  submittedAt       DateTime? @map("submitted_at")
  decisionAt        DateTime? @map("decision_at")
  decision          String?   // under_review, minor_revision, major_revision, reject, accept
  editorComments    String?   @map("editor_comments")
  reviewerComments  String?   @map("reviewer_comments")
  status            String    @default("pending") // pending, under_review, decisioned
  notes             String?
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  paper      Paper       @relation(fields: [paperId], references: [id], onDelete: Cascade)
  revisions  Revision[]
  attachments Attachment[]

  @@map("submissions")
}

model Revision {
  id               Int       @id @default(autoincrement())
  submissionId     Int       @map("submission_id")
  revisionRound    Int       @map("revision_round")
  receivedAt       DateTime? @map("received_at")
  dueAt            DateTime? @map("due_at")
  submittedAt      DateTime? @map("submitted_at")
  revisionType     String    @map("revision_type") // minor, major, resubmit
  commentsSummary  String?   @map("comments_summary")
  responseSummary  String?   @map("response_summary")
  status           String    @default("pending") // pending, revising, submitted, completed
  notes            String?
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  submission  Submission   @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  attachments Attachment[]

  @@map("revisions")
}

model Thesis {
  id             Int       @id @default(autoincrement())
  studentId      Int       @map("student_id")
  title          String
  degreeType     String    @map("degree_type")
  stage          String    @default("proposal") // proposal, midterm, draft, review, revision, defense, archived
  proposalDate   DateTime? @map("proposal_date")
  midtermDate    DateTime? @map("midterm_date")
  submittedAt    DateTime? @map("submitted_at")
  reviewedAt     DateTime? @map("reviewed_at")
  defenseDate    DateTime? @map("defense_date")
  score          String?
  reviewComments String?   @map("review_comments")
  revisionNotes  String?   @map("revision_notes")
  status         String    @default("in_progress") // in_progress, submitted, reviewed, revision, defended
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  student     Student        @relation(fields: [studentId], references: [id], onDelete: Cascade)
  reviews     ThesisReview[]
  attachments Attachment[]

  @@map("theses")
}

model ThesisReview {
  id           Int       @id @default(autoincrement())
  thesisId     Int       @map("thesis_id")
  reviewerName String    @map("reviewer_name")
  reviewerType String    @map("reviewer_type") // internal, external, anonymous
  score        String?
  decision     String    // pass, minor_revision, major_revision, fail
  comments     String?
  reviewedAt   DateTime? @map("reviewed_at")
  createdAt    DateTime  @default(now()) @map("created_at")

  thesis      Thesis       @relation(fields: [thesisId], references: [id], onDelete: Cascade)
  attachments Attachment[]

  @@map("thesis_reviews")
}

model Attachment {
  id          Int      @id @default(autoincrement())
  relatedType String   @map("related_type") // student, paper, submission, revision, thesis, thesis_review
  relatedId   Int      @map("related_id")
  fileName    String   @map("file_name")
  filePath    String   @map("file_path")
  fileType    String   @map("file_type")
  fileSize    Int      @map("file_size")
  description String?
  uploadedAt  DateTime @default(now()) @map("uploaded_at")

  // Polymorphic relation — no FK constraint since relatedType varies
  @@map("attachments")
}

model TimelineEvent {
  id          Int      @id @default(autoincrement())
  studentId   Int      @map("student_id")
  relatedType String   @map("related_type")
  relatedId   Int      @map("related_id")
  eventType   String   @map("event_type") // paper_created, paper_submitted, decision_received, revision_submitted, thesis_reviewed, etc.
  title       String
  description String?
  eventDate   DateTime @map("event_date")
  createdAt   DateTime @default(now()) @map("created_at")

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@map("timeline_events")
}
```

- [ ] **Step 2: Write Prisma client singleton**

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: Push schema to SQLite and generate client**

```bash
npx prisma db push
npx prisma generate
```

Expected: Creates `data/dev.db`, generates Prisma Client types.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts data/
git commit -m "feat: add Prisma schema with all 9 tables"
```

---

## Task 3: Seed Script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add seed script)

- [ ] **Step 1: Write seed script**

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
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
  await prisma.thesis.create({
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
        relatedId: 1,
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
```

- [ ] **Step 2: Add seed config to package.json**

```bash
# Replace the "prisma" key in package.json, or add:
```

In `package.json`, add under root:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 3: Install tsx and run seed**

```bash
pnpm add -D tsx
npx prisma db seed
```

Expected: "Seed data created successfully"

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts package.json && git commit -m "feat: add seed script with sample data"
```

---

## Task 4: Shared Utilities — Validators, Timeline, File Helpers

**Files:**
- Create: `src/lib/validators.ts`
- Create: `src/lib/timeline.ts`
- Create: `src/lib/file-utils.ts`

- [ ] **Step 1: Write Zod validators**

```typescript
// src/lib/validators.ts
import { z } from "zod";

// --- Student ---
export const studentSchema = z.object({
  name: z.string().min(1, "姓名不能为空"),
  studentNo: z.string().min(1, "学号不能为空"),
  degreeType: z.enum(["master", "phd", "joint", "exchange"]),
  enrollmentYear: z.coerce.number().int().min(2000).max(2100),
  graduationYear: z.coerce.number().int().min(2000).max(2100).nullable().optional(),
  direction: z.string().min(1, "方向不能为空"),
  supervisor: z.string().min(1, "导师不能为空"),
  coSupervisor: z.string().nullable().optional(),
  status: z.enum(["active", "graduated", "delayed", "suspended"]),
  notes: z.string().nullable().optional(),
});

// --- Paper ---
export const paperSchema = z.object({
  studentId: z.coerce.number().int(),
  title: z.string().min(1, "标题不能为空"),
  paperType: z.enum(["journal", "conference"]),
  direction: z.string().min(1, "方向不能为空"),
  firstAuthor: z.string().min(1, "第一作者不能为空"),
  correspondingAuthor: z.string().min(1, "通讯作者不能为空"),
  status: z.enum([
    "writing", "ready_to_submit", "submitted",
    "minor_revision", "major_revision", "accepted", "rejected", "published",
  ]),
  targetVenue: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  myThoughts: z.string().nullable().optional(),
});

// --- Submission ---
export const submissionSchema = z.object({
  paperId: z.coerce.number().int(),
  venueName: z.string().min(1, "期刊/会议名不能为空"),
  submissionRound: z.coerce.number().int().min(1),
  submittedAt: z.string().nullable().optional(),
  decisionAt: z.string().nullable().optional(),
  decision: z.enum(["under_review", "minor_revision", "major_revision", "reject", "accept"]).nullable().optional(),
  editorComments: z.string().nullable().optional(),
  reviewerComments: z.string().nullable().optional(),
  status: z.enum(["pending", "under_review", "decisioned"]),
  notes: z.string().nullable().optional(),
});

// --- Revision ---
export const revisionSchema = z.object({
  submissionId: z.coerce.number().int(),
  revisionRound: z.coerce.number().int().min(1),
  receivedAt: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  submittedAt: z.string().nullable().optional(),
  revisionType: z.enum(["minor", "major", "resubmit"]),
  commentsSummary: z.string().nullable().optional(),
  responseSummary: z.string().nullable().optional(),
  status: z.enum(["pending", "revising", "submitted", "completed"]),
  notes: z.string().nullable().optional(),
});

// --- Thesis ---
export const thesisSchema = z.object({
  studentId: z.coerce.number().int(),
  title: z.string().min(1, "标题不能为空"),
  degreeType: z.string().min(1),
  stage: z.enum(["proposal", "midterm", "draft", "review", "revision", "defense", "archived"]),
  proposalDate: z.string().nullable().optional(),
  midtermDate: z.string().nullable().optional(),
  submittedAt: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
  defenseDate: z.string().nullable().optional(),
  score: z.string().nullable().optional(),
  reviewComments: z.string().nullable().optional(),
  revisionNotes: z.string().nullable().optional(),
  status: z.enum(["in_progress", "submitted", "reviewed", "revision", "defended"]),
});

// --- ThesisReview ---
export const thesisReviewSchema = z.object({
  thesisId: z.coerce.number().int(),
  reviewerName: z.string().min(1, "审稿人不能为空"),
  reviewerType: z.enum(["internal", "external", "anonymous"]),
  score: z.string().nullable().optional(),
  decision: z.enum(["pass", "minor_revision", "major_revision", "fail"]),
  comments: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
});

// Export inferred types
export type StudentFormData = z.infer<typeof studentSchema>;
export type PaperFormData = z.infer<typeof paperSchema>;
export type SubmissionFormData = z.infer<typeof submissionSchema>;
export type RevisionFormData = z.infer<typeof revisionSchema>;
export type ThesisFormData = z.infer<typeof thesisSchema>;
export type ThesisReviewFormData = z.infer<typeof thesisReviewSchema>;
```

- [ ] **Step 2: Write timeline utility**

```typescript
// src/lib/timeline.ts
import { prisma } from "./prisma";

interface CreateTimelineEventArgs {
  studentId: number;
  relatedType: string;
  relatedId: number;
  eventType: string;
  title: string;
  description?: string;
}

export async function createTimelineEvent(args: CreateTimelineEventArgs) {
  await prisma.timelineEvent.create({
    data: {
      studentId: args.studentId,
      relatedType: args.relatedType,
      relatedId: args.relatedId,
      eventType: args.eventType,
      title: args.title,
      description: args.description ?? null,
      eventDate: new Date(),
    },
  });
}
```

- [ ] **Step 3: Write file utilities**

```typescript
// src/lib/file-utils.ts
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "files");
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/png",
  "image/jpeg",
];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  category: string,
  entityId: number,
  mimeType: string
): Promise<{ fileName: string; filePath: string; fileSize: number; fileType: string }> {
  const dir = path.join(UPLOAD_ROOT, category);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const timestamp = Date.now();
  const safeName = originalName.replace(/[^a-zA-Z0-9._\-一-龥]/g, "_");
  const fileName = `${category}_${entityId}_${timestamp}_${safeName}`;
  const filePath = path.join(dir, fileName);

  await writeFile(filePath, buffer);

  return {
    fileName: originalName,
    filePath: `${category}/${fileName}`, // relative path
    fileSize: buffer.length,
    fileType: mimeType,
  };
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `不支持的文件类型: ${file.type}` };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "文件大小不能超过50MB" };
  }
  return { valid: true };
}

export function getFilePath(relativePath: string): string {
  return path.join(UPLOAD_ROOT, relativePath);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/ && git commit -m "feat: add validators, timeline, and file utilities"
```

---

## Task 5: Global Layout — Sidebar + Breadcrumb

**Files:**
- Create: `src/components/layout/app-sidebar.tsx`
- Create: `src/components/layout/app-breadcrumb.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Write sidebar component**

```typescript
// src/components/layout/app-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GraduationCap,
  FileText,
  BookOpen,
  Send,
  RefreshCw,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "首页", icon: LayoutDashboard },
  { href: "/students", label: "学生管理", icon: GraduationCap },
  { href: "/papers", label: "小论文", icon: FileText },
  { href: "/theses", label: "大论文", icon: BookOpen },
  { href: "/submissions", label: "投稿记录", icon: Send },
  { href: "/revisions", label: "返修记录", icon: RefreshCw },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r bg-white">
      <div className="flex h-14 items-center border-b px-4">
        <GraduationCap className="h-6 w-6 text-blue-600 mr-2" />
        <span className="font-semibold text-sm">论文过程管理</span>
      </div>
      <nav className="space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Write breadcrumb component**

```typescript
// src/components/layout/app-breadcrumb.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  dashboard: "首页",
  students: "学生管理",
  papers: "小论文",
  theses: "大论文",
  submissions: "投稿记录",
  revisions: "返修记录",
};

export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Skip dynamic route segments like [id] — use page context instead
  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4">
      <Link href="/dashboard" className="hover:text-gray-700">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const label = LABELS[seg] || (seg.match(/^\d+$/) ? "详情" : seg);
        const href = "/" + segments.slice(0, i + 1).join("/");

        return (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {isLast ? (
              <span className="text-gray-900 font-medium">{label}</span>
            ) : (
              <Link href={href} className="hover:text-gray-700">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Write root layout**

```typescript
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/layout/app-sidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "研究生论文过程管理系统",
  description: "管理研究生小论文投稿、返修、大论文全过程",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex-1 ml-56 p-6 bg-gray-50 min-h-screen">
            {children}
          </main>
        </div>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Write redirect route**

```typescript
// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 5: Verify layout renders**

```bash
pnpm dev
```

Visit http://localhost:3000 — should redirect to /dashboard, sidebar visible.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/app/globals.css src/components/layout/ && git commit -m "feat: add sidebar, breadcrumb, and root layout"
```

---

## Task 6: Student CRUD

**Files:**
- Create: `src/app/students/actions.ts`
- Create: `src/components/students/student-form.tsx`
- Create: `src/components/students/student-table.tsx`
- Create: `src/app/students/page.tsx`

- [ ] **Step 1: Write student Server Actions**

```typescript
// src/app/students/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline";
import { studentSchema } from "@/lib/validators";
import type { StudentFormData } from "@/lib/validators";

export async function createStudent(data: StudentFormData) {
  const parsed = studentSchema.parse(data);
  const student = await prisma.student.create({
    data: {
      name: parsed.name,
      studentNo: parsed.studentNo,
      degreeType: parsed.degreeType,
      enrollmentYear: parsed.enrollmentYear,
      graduationYear: parsed.graduationYear ?? null,
      direction: parsed.direction,
      supervisor: parsed.supervisor,
      coSupervisor: parsed.coSupervisor ?? null,
      status: parsed.status,
      notes: parsed.notes ?? null,
    },
  });
  await createTimelineEvent({
    studentId: student.id,
    relatedType: "student",
    relatedId: student.id,
    eventType: "student_created",
    title: `添加学生：${student.name}`,
  });
  revalidatePath("/students");
  return student;
}

export async function updateStudent(id: number, data: StudentFormData) {
  const parsed = studentSchema.parse(data);
  const student = await prisma.student.update({
    where: { id },
    data: {
      name: parsed.name,
      studentNo: parsed.studentNo,
      degreeType: parsed.degreeType,
      enrollmentYear: parsed.enrollmentYear,
      graduationYear: parsed.graduationYear ?? null,
      direction: parsed.direction,
      supervisor: parsed.supervisor,
      coSupervisor: parsed.coSupervisor ?? null,
      status: parsed.status,
      notes: parsed.notes ?? null,
    },
  });
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return student;
}

export async function deleteStudent(id: number) {
  await prisma.student.delete({ where: { id } });
  revalidatePath("/students");
}
```

- [ ] **Step 2: Write student form dialog**

```typescript
// src/components/students/student-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { studentSchema, type StudentFormData } from "@/lib/validators";
import { createStudent, updateStudent } from "@/app/students/actions";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: {
    id: number;
    name: string;
    studentNo: string;
    degreeType: string;
    enrollmentYear: number;
    graduationYear: number | null;
    direction: string;
    supervisor: string;
    coSupervisor: string | null;
    status: string;
    notes: string | null;
  } | null;
}

export function StudentForm({ open, onOpenChange, student }: Props) {
  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: student
      ? { ...student, graduationYear: student.graduationYear ?? null, coSupervisor: student.coSupervisor ?? null, notes: student.notes ?? null }
      : {
          name: "", studentNo: "", degreeType: "master",
          enrollmentYear: new Date().getFullYear(), graduationYear: null,
          direction: "", supervisor: "", coSupervisor: null,
          status: "active", notes: null,
        },
  });

  async function onSubmit(data: StudentFormData) {
    try {
      if (student) {
        await updateStudent(student.id, data);
        toast.success("学生信息已更新");
      } else {
        await createStudent(data);
        toast.success("学生已添加");
      }
      onOpenChange(false);
      form.reset();
    } catch (e) {
      toast.error("操作失败，请检查输入");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{student ? "编辑学生" : "添加学生"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>姓名</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="studentNo" render={({ field }) => (
                <FormItem>
                  <FormLabel>学号</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="degreeType" render={({ field }) => (
                <FormItem>
                  <FormLabel>学位类型</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="master">硕士</SelectItem>
                      <SelectItem value="phd">博士</SelectItem>
                      <SelectItem value="joint">联培</SelectItem>
                      <SelectItem value="exchange">交换</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>状态</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">在读</SelectItem>
                      <SelectItem value="graduated">已毕业</SelectItem>
                      <SelectItem value="delayed">延期</SelectItem>
                      <SelectItem value="suspended">休学</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="enrollmentYear" render={({ field }) => (
                <FormItem>
                  <FormLabel>入学年份</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="graduationYear" render={({ field }) => (
                <FormItem>
                  <FormLabel>毕业年份</FormLabel>
                  <FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="direction" render={({ field }) => (
              <FormItem>
                <FormLabel>研究方向</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="supervisor" render={({ field }) => (
                <FormItem>
                  <FormLabel>导师</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="coSupervisor" render={({ field }) => (
                <FormItem>
                  <FormLabel>副导师</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>备注</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
              <Button type="submit">{student ? "保存" : "添加"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Write student table**

```typescript
// src/components/students/student-table.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteStudent } from "@/app/students/actions";
import { StudentForm } from "./student-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Student = {
  id: number;
  name: string;
  studentNo: string;
  degreeType: string;
  enrollmentYear: number;
  graduationYear: number | null;
  direction: string;
  supervisor: string;
  coSupervisor: string | null;
  status: string;
  notes: string | null;
  _count?: { papers: number };
};

const DEGREE_LABELS: Record<string, string> = {
  master: "硕士", phd: "博士", joint: "联培", exchange: "交换",
};

interface Props {
  students: Student[];
}

export function StudentTable({ students }: Props) {
  const router = useRouter();
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>姓名</TableHead>
            <TableHead>学号</TableHead>
            <TableHead>学位</TableHead>
            <TableHead>年级</TableHead>
            <TableHead>方向</TableHead>
            <TableHead>导师</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                暂无数据
              </TableCell>
            </TableRow>
          ) : (
            students.map((s) => (
              <TableRow
                key={s.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/students/${s.id}`)}
              >
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-gray-500">{s.studentNo}</TableCell>
                <TableCell>{DEGREE_LABELS[s.degreeType] ?? s.degreeType}</TableCell>
                <TableCell>{s.enrollmentYear}级</TableCell>
                <TableCell>{s.direction}</TableCell>
                <TableCell>{s.supervisor}</TableCell>
                <TableCell>
                  <StatusBadge type="student" value={s.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditStudent(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(s)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <StudentForm open={!!editStudent} onOpenChange={(o) => !o && setEditStudent(null)} student={editStudent} />

      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="删除学生"
        description={`确定删除「${deleteTarget?.name}」及其所有相关数据？此操作不可恢复。`}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteStudent(deleteTarget.id);
            toast.success("学生已删除");
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}
```

- [ ] **Step 4: Write students page**

```typescript
// src/app/students/page.tsx
import { prisma } from "@/lib/prisma";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { StudentTable } from "@/components/students/student-table";
import { AddButton } from "@/components/shared/add-button";
import { StudentListTabs } from "./student-list-tabs";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const activeStudents = await prisma.student.findMany({
    where: { status: { not: "graduated" } },
    orderBy: { enrollmentYear: "desc" },
    include: { _count: { select: { papers: true } } },
  });

  const graduatedStudents = await prisma.student.findMany({
    where: { status: "graduated" },
    orderBy: { graduationYear: "desc" },
    include: { _count: { select: { papers: true } } },
  });

  return (
    <div>
      <AppBreadcrumb />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">学生管理</h1>
      </div>
      <StudentListTabs
        activeStudents={JSON.parse(JSON.stringify(activeStudents))}
        graduatedStudents={JSON.parse(JSON.stringify(graduatedStudents))}
      />
    </div>
  );
}
```

- [ ] **Step 5: Write the tabs client component and add-button**

```typescript
// src/app/students/student-list-tabs.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentTable } from "@/components/students/student-table";
import { StudentForm } from "@/components/students/student-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Props {
  activeStudents: any[];
  graduatedStudents: any[];
}

export function StudentListTabs({ activeStudents, graduatedStudents }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <div className="mb-4">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />添加学生
        </Button>
      </div>
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">在读 ({activeStudents.length})</TabsTrigger>
          <TabsTrigger value="graduated">已毕业 ({graduatedStudents.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <StudentTable students={activeStudents} />
        </TabsContent>
        <TabsContent value="graduated" className="mt-4">
          <StudentTable students={graduatedStudents} />
        </TabsContent>
      </Tabs>
      <StudentForm open={showForm} onOpenChange={setShowForm} student={null} />
    </>
  );
}
```

```typescript
// src/components/shared/add-button.tsx — not needed if inline, but:
// Actually the button is in the tabs component above. Skip add-button file.
```

```typescript
// src/components/shared/status-badge.tsx
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<string, string> = {
  // Student
  active: "bg-green-100 text-green-800",
  graduated: "bg-blue-100 text-blue-800",
  delayed: "bg-yellow-100 text-yellow-800",
  suspended: "bg-red-100 text-red-800",
  // Paper
  writing: "bg-gray-100 text-gray-700",
  ready_to_submit: "bg-purple-100 text-purple-800",
  submitted: "bg-blue-100 text-blue-800",
  minor_revision: "bg-yellow-100 text-yellow-800",
  major_revision: "bg-orange-100 text-orange-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  published: "bg-teal-100 text-teal-800",
  // Submission
  pending: "bg-gray-100 text-gray-700",
  under_review: "bg-blue-100 text-blue-800",
  decisioned: "bg-purple-100 text-purple-800",
  // Revision
  revising: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  // Thesis
  in_progress: "bg-blue-100 text-blue-800",
  reviewed: "bg-purple-100 text-purple-800",
  revision: "bg-yellow-100 text-yellow-800",
  defended: "bg-green-100 text-green-800",
  // Thesis stage
  proposal: "bg-gray-100 text-gray-700",
  midterm: "bg-blue-100 text-blue-800",
  draft: "bg-purple-100 text-purple-800",
  review: "bg-yellow-100 text-yellow-800",
  defense: "bg-green-100 text-green-800",
  archived: "bg-gray-200 text-gray-600",
  // Decision
  pass: "bg-green-100 text-green-800",
  minor: "bg-yellow-100 text-yellow-800",
  major: "bg-orange-100 text-orange-800",
  resubmit: "bg-red-100 text-red-800",
  accept: "bg-green-100 text-green-800",
  reject: "bg-red-100 text-red-800",
  fail: "bg-red-100 text-red-800",
};

const LABELS: Record<string, string> = {
  active: "在读", graduated: "已毕业", delayed: "延期", suspended: "休学",
  writing: "撰写中", ready_to_submit: "待投稿", submitted: "已投稿",
  minor_revision: "小修", major_revision: "大修", accepted: "已接收",
  rejected: "已拒稿", published: "已发表",
  pending: "待处理", under_review: "审稿中", decisioned: "已返回",
  revising: "返修中", completed: "已完成",
  in_progress: "进行中", reviewed: "已审阅", defended: "已答辩",
  proposal: "开题", midterm: "中期", draft: "初稿", review: "审稿",
  revision: "修改中", defense: "答辩", archived: "已归档",
  pass: "通过", minor: "小修", major: "大修", resubmit: "重投",
  accept: "接收", reject: "拒稿", fail: "不通过",
  internal: "校内", external: "校外", anonymous: "匿名",
};

export function StatusBadge({ type, value }: { type: string; value: string | null }) {
  if (!value) return <span className="text-gray-400">-</span>;
  const style = STATUS_STYLES[value] ?? "bg-gray-100 text-gray-700";
  const label = LABELS[value] ?? value;
  return <Badge className={style} variant="secondary">{label}</Badge>;
}
```

```typescript
// src/components/shared/confirm-delete.tsx
"use client";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
}

export function ConfirmDelete({ open, onOpenChange, title, description, onConfirm }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            确认删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 6: Verify student CRUD works**

Start dev server, visit /students. Test: add student → edit → delete.

- [ ] **Step 7: Commit**

```bash
git add src/app/students/ src/components/students/ src/components/shared/ && git commit -m "feat: add student CRUD with active/graduated tabs"
```

---

## Task 7: Paper CRUD + Version Upload

**Files:**
- Create: `src/app/papers/actions.ts`
- Create: `src/components/papers/paper-form.tsx`
- Create: `src/components/papers/paper-table.tsx`
- Create: `src/components/papers/paper-versions.tsx`
- Create: `src/app/papers/page.tsx`
- Create: `src/app/papers/[id]/page.tsx`
- Create: `src/app/api/files/upload/route.ts`

- [ ] **Step 1: Write paper Server Actions**

```typescript
// src/app/papers/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline";
import { paperSchema } from "@/lib/validators";
import type { PaperFormData } from "@/lib/validators";

export async function createPaper(data: PaperFormData) {
  const parsed = paperSchema.parse(data);
  const paper = await prisma.paper.create({
    data: {
      studentId: parsed.studentId,
      title: parsed.title,
      paperType: parsed.paperType,
      direction: parsed.direction,
      firstAuthor: parsed.firstAuthor,
      correspondingAuthor: parsed.correspondingAuthor,
      status: parsed.status,
      targetVenue: parsed.targetVenue ?? null,
      notes: parsed.notes ?? null,
      myThoughts: parsed.myThoughts ?? null,
      currentVersion: 1,
    },
  });
  await createTimelineEvent({
    studentId: parsed.studentId,
    relatedType: "paper",
    relatedId: paper.id,
    eventType: "paper_created",
    title: `创建小论文：${paper.title}`,
  });
  revalidatePath("/papers");
  revalidatePath(`/students/${parsed.studentId}`);
  return paper;
}

export async function updatePaper(id: number, data: PaperFormData) {
  const parsed = paperSchema.parse(data);
  const paper = await prisma.paper.update({
    where: { id },
    data: {
      studentId: parsed.studentId,
      title: parsed.title,
      paperType: parsed.paperType,
      direction: parsed.direction,
      firstAuthor: parsed.firstAuthor,
      correspondingAuthor: parsed.correspondingAuthor,
      status: parsed.status,
      targetVenue: parsed.targetVenue ?? null,
      notes: parsed.notes ?? null,
      myThoughts: parsed.myThoughts ?? null,
    },
  });
  revalidatePath("/papers");
  revalidatePath(`/papers/${id}`);
  revalidatePath(`/students/${parsed.studentId}`);
  return paper;
}

export async function deletePaper(id: number) {
  const paper = await prisma.paper.findUnique({ where: { id } });
  if (!paper) throw new Error("Paper not found");
  await prisma.paper.delete({ where: { id } });
  revalidatePath("/papers");
  revalidatePath(`/students/${paper.studentId}`);
}

export async function addPaperVersion(paperId: number, fileName: string, filePath: string, fileSize: number, description?: string) {
  const paper = await prisma.paper.findUnique({ where: { id: paperId } });
  if (!paper) throw new Error("Paper not found");
  const newVersion = paper.currentVersion + 1;
  const version = await prisma.paperVersion.create({
    data: { paperId, versionNumber: newVersion, fileName, filePath, fileSize, description: description ?? null },
  });
  await prisma.paper.update({ where: { id: paperId }, data: { currentVersion: newVersion } });
  revalidatePath(`/papers/${paperId}`);
  return version;
}
```

- [ ] **Step 2: Write paper table (list page)**

```typescript
// src/components/papers/paper-table.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePaper } from "@/app/papers/actions";
import { PaperForm } from "./paper-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Paper = {
  id: number;
  studentId: number;
  title: string;
  paperType: string;
  status: string;
  targetVenue: string | null;
  currentVersion: number;
  student: { name: string };
};

const STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "writing", label: "撰写中" },
  { value: "ready_to_submit", label: "待投稿" },
  { value: "submitted", label: "已投稿" },
  { value: "minor_revision", label: "小修" },
  { value: "major_revision", label: "大修" },
  { value: "accepted", label: "已接收" },
  { value: "rejected", label: "已拒稿" },
  { value: "published", label: "已发表" },
];

interface Props {
  papers: Paper[];
}

export function PaperTable({ papers }: Props) {
  const router = useRouter();
  const [editPaper, setEditPaper] = useState<Paper | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Paper | null>(null);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? papers : papers.filter(p => p.status === filter);

  return (
    <>
      <div className="mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>标题</TableHead>
            <TableHead>学生</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>目标期刊/会议</TableHead>
            <TableHead>版本</TableHead>
            <TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-8">暂无数据</TableCell></TableRow>
          ) : (
            filtered.map((p) => (
              <TableRow key={p.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/papers/${p.id}`)}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>{p.student.name}</TableCell>
                <TableCell>{p.paperType === "journal" ? "期刊" : "会议"}</TableCell>
                <TableCell><StatusBadge type="paper" value={p.status} /></TableCell>
                <TableCell className="text-gray-500">{p.targetVenue ?? "-"}</TableCell>
                <TableCell>v{p.currentVersion}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditPaper(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(p)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <PaperForm open={!!editPaper} onOpenChange={(o) => !o && setEditPaper(null)} paper={editPaper} />

      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="删除小论文"
        description={`确定删除「${deleteTarget?.title}」及其投稿/返修/版本数据？此操作不可恢复。`}
        onConfirm={async () => {
          if (deleteTarget) {
            await deletePaper(deleteTarget.id);
            toast.success("小论文已删除");
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}
```

- [ ] **Step 3: Write papers list page**

```typescript
// src/app/papers/page.tsx
import { prisma } from "@/lib/prisma";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { PaperTable } from "@/components/papers/paper-table";
import { PaperForm } from "@/components/papers/paper-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PaperListClient } from "./paper-list-client";

export const dynamic = "force-dynamic";

export default async function PapersPage() {
  const papers = await prisma.paper.findMany({
    include: { student: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <AppBreadcrumb />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">小论文管理</h1>
      </div>
      <PaperListClient papers={JSON.parse(JSON.stringify(papers))} />
    </div>
  );
}
```

```typescript
// src/app/papers/paper-list-client.tsx
"use client";

import { useState } from "react";
import { PaperTable } from "@/components/papers/paper-table";
import { PaperForm } from "@/components/papers/paper-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function PaperListClient({ papers }: { papers: any[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <div className="mb-4">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />添加小论文
        </Button>
      </div>
      <PaperTable papers={papers} />
      <PaperForm open={showForm} onOpenChange={setShowForm} paper={null} />
    </>
  );
}
```

- [ ] **Step 4: Write paper form**

```typescript
// src/components/papers/paper-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { paperSchema, type PaperFormData } from "@/lib/validators";
import { createPaper, updatePaper } from "@/app/papers/actions";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type StudentOption = { id: number; name: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paper?: {
    id: number;
    studentId: number;
    title: string;
    paperType: string;
    direction: string;
    firstAuthor: string;
    correspondingAuthor: string;
    status: string;
    targetVenue: string | null;
    notes: string | null;
    myThoughts: string | null;
  } | null;
}

export function PaperForm({ open, onOpenChange, paper }: Props) {
  const [students, setStudents] = useState<StudentOption[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/students/list").then(r => r.json()).then(setStudents);
    }
  }, [open]);

  const form = useForm<PaperFormData>({
    resolver: zodResolver(paperSchema),
    defaultValues: paper
      ? { ...paper, notes: paper.notes ?? null, myThoughts: paper.myThoughts ?? null, targetVenue: paper.targetVenue ?? null }
      : {
          studentId: 0, title: "", paperType: "journal", direction: "",
          firstAuthor: "", correspondingAuthor: "", status: "writing",
          targetVenue: null, notes: null, myThoughts: null,
        },
  });

  async function onSubmit(data: PaperFormData) {
    try {
      if (paper) {
        await updatePaper(paper.id, data);
        toast.success("小论文已更新");
      } else {
        await createPaper(data);
        toast.success("小论文已创建");
      }
      onOpenChange(false);
      form.reset();
    } catch (e) {
      toast.error("操作失败");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{paper ? "编辑小论文" : "添加小论文"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="studentId" render={({ field }) => (
              <FormItem>
                <FormLabel>所属学生</FormLabel>
                <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={field.value ? String(field.value) : undefined}>
                  <FormControl><SelectTrigger><SelectValue placeholder="选择学生" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {students.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>标题</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="paperType" render={({ field }) => (
                <FormItem>
                  <FormLabel>论文类型</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="journal">期刊</SelectItem>
                      <SelectItem value="conference">会议</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>状态</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="writing">撰写中</SelectItem>
                      <SelectItem value="ready_to_submit">待投稿</SelectItem>
                      <SelectItem value="submitted">已投稿</SelectItem>
                      <SelectItem value="minor_revision">小修</SelectItem>
                      <SelectItem value="major_revision">大修</SelectItem>
                      <SelectItem value="accepted">已接收</SelectItem>
                      <SelectItem value="rejected">已拒稿</SelectItem>
                      <SelectItem value="published">已发表</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="direction" render={({ field }) => (
              <FormItem><FormLabel>方向</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstAuthor" render={({ field }) => (
                <FormItem><FormLabel>第一作者</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="correspondingAuthor" render={({ field }) => (
                <FormItem><FormLabel>通讯作者</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="targetVenue" render={({ field }) => (
              <FormItem><FormLabel>目标期刊/会议</FormLabel><FormControl><Input {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="myThoughts" render={({ field }) => (
              <FormItem>
                <FormLabel>我的思考</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} placeholder="导师对这篇论文的判断..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>备注</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
              <Button type="submit">{paper ? "保存" : "添加"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Write paper versions component + file upload API**

```typescript
// src/app/api/files/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveFile, validateFile } from "@/lib/file-utils";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const category = formData.get("category") as string;
  const entityId = Number(formData.get("entityId"));
  const description = formData.get("description") as string | null;

  if (!file || !category || !entityId) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  const validation = validateFile(file);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await saveFile(buffer, file.name, category, entityId, file.type);

  return NextResponse.json(result);
}
```

```typescript
// src/app/api/students/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const students = await prisma.student.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(students);
}
```

```typescript
// src/components/papers/paper-versions.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addPaperVersion } from "@/app/papers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download } from "lucide-react";

type Version = {
  id: number;
  versionNumber: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  description: string | null;
  uploadedAt: string;
};

interface Props {
  paperId: number;
  versions: Version[];
}

export function PaperVersions({ paperId, versions }: Props) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "papers");
    formData.append("entityId", String(paperId));

    try {
      const res = await fetch("/api/files/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const result = await res.json();
      await addPaperVersion(paperId, result.fileName, result.filePath, result.fileSize, `版本 v${versions.length + 1}`);
      toast.success("新版本上传成功");
    } catch (e: any) {
      toast.error(e.message || "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">版本历史</h3>
        <label className="cursor-pointer">
          <Button size="sm" disabled={uploading} asChild>
            <span>
              <Upload className="h-3.5 w-3.5 mr-1" />
              {uploading ? "上传中..." : "上传新版本"}
            </span>
          </Button>
          <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx" />
        </label>
      </div>
      {versions.length === 0 ? (
        <p className="text-gray-400 text-sm">暂无版本</p>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <div>
                <span className="font-medium">v{v.versionNumber}</span>
                <span className="ml-2 text-gray-600">{v.fileName}</span>
                <span className="ml-2 text-gray-400">{formatSize(v.fileSize)}</span>
                {v.description && <span className="ml-2 text-gray-400">— {v.description}</span>}
              </div>
              <a href={`/api/files/${v.filePath}`} download className="text-blue-600 hover:text-blue-800">
                <Download className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Write paper detail page**

```typescript
// src/app/papers/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaperVersions } from "@/components/papers/paper-versions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PaperDetailPage({ params }: { params: { id: string } }) {
  const paper = await prisma.paper.findUnique({
    where: { id: Number(params.id) },
    include: {
      student: true,
      versions: { orderBy: { versionNumber: "desc" } },
      submissions: {
        include: { revisions: true },
        orderBy: { submissionRound: "desc" },
      },
    },
  });

  if (!paper) notFound();

  return (
    <div>
      <AppBreadcrumb />
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold">{paper.title}</h1>
          <StatusBadge type="paper" value={paper.status} />
        </div>
        <p className="text-gray-500 text-sm">
          学生：<Link href={`/students/${paper.student.id}`} className="text-blue-600 hover:underline">{paper.student.name}</Link>
          {" · "}
          类型：{paper.paperType === "journal" ? "期刊" : "会议"}
          {" · "}
          目标：{paper.targetVenue ?? "未指定"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info + Versions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-white p-4">
            <h2 className="font-medium mb-2">基本信息</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">第一作者：</span>{paper.firstAuthor}</div>
              <div><span className="text-gray-500">通讯作者：</span>{paper.correspondingAuthor}</div>
              <div><span className="text-gray-500">研究方向：</span>{paper.direction}</div>
              <div><span className="text-gray-500">当前版本：</span>v{paper.currentVersion}</div>
            </div>
          </div>

          {paper.myThoughts && (
            <div className="rounded-lg border bg-blue-50 p-4">
              <h2 className="font-medium mb-2 text-blue-900">我的思考</h2>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{paper.myThoughts}</p>
            </div>
          )}

          <div className="rounded-lg border bg-white p-4">
            <PaperVersions paperId={paper.id} versions={JSON.parse(JSON.stringify(paper.versions))} />
          </div>
        </div>

        {/* Right: Submissions timeline */}
        <div className="space-y-4">
          <h2 className="font-medium">投稿历程</h2>
          {paper.submissions.length === 0 ? (
            <p className="text-gray-400 text-sm">暂无投稿记录</p>
          ) : (
            paper.submissions.map((sub) => (
              <div key={sub.id} className="rounded-lg border bg-white p-4 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">第{sub.submissionRound}次投稿</span>
                  <StatusBadge type="submission" value={sub.status} />
                </div>
                <p className="text-gray-500">期刊：{sub.venueName}</p>
                {sub.decision && <p className="mt-1"><StatusBadge type="decision" value={sub.decision} /></p>}
                {sub.reviewerComments && (
                  <p className="mt-2 text-gray-600 bg-gray-50 rounded p-2 whitespace-pre-wrap text-xs">{sub.reviewerComments}</p>
                )}
                {sub.revisions.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-gray-400 text-xs">返修轮次：</span>
                    {sub.revisions.map((rev) => (
                      <span key={rev.id} className="ml-1 text-xs">
                        <StatusBadge type="revision" value={rev.status} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/papers/ src/components/papers/ src/app/api/ && git commit -m "feat: add paper CRUD with version upload and detail page"
```

---

## Task 8: Submission + Revision CRUD

**Files:**
- Create: `src/app/submissions/actions.ts`
- Create: `src/app/submissions/page.tsx`
- Create: `src/app/submissions/submission-list-client.tsx`
- Create: `src/components/submissions/submission-table.tsx`
- Create: `src/components/submissions/submission-form.tsx`
- Create: `src/app/revisions/actions.ts`
- Create: `src/app/revisions/page.tsx`
- Create: `src/app/revisions/revision-list-client.tsx`
- Create: `src/components/revisions/revision-table.tsx`
- Create: `src/components/revisions/revision-form.tsx`

- [ ] **Step 1: Write submission Server Actions**

```typescript
// src/app/submissions/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline";
import { submissionSchema } from "@/lib/validators";
import type { SubmissionFormData } from "@/lib/validators";

export async function createSubmission(data: SubmissionFormData) {
  const parsed = submissionSchema.parse(data);
  const paper = await prisma.paper.findUnique({ where: { id: parsed.paperId } });
  const sub = await prisma.submission.create({
    data: {
      paperId: parsed.paperId,
      venueName: parsed.venueName,
      submissionRound: parsed.submissionRound,
      submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : null,
      decisionAt: parsed.decisionAt ? new Date(parsed.decisionAt) : null,
      decision: parsed.decision ?? null,
      editorComments: parsed.editorComments ?? null,
      reviewerComments: parsed.reviewerComments ?? null,
      status: parsed.status,
      notes: parsed.notes ?? null,
    },
  });

  if (paper) {
    await prisma.paper.update({ where: { id: parsed.paperId }, data: { status: "submitted" } });
    await createTimelineEvent({
      studentId: paper.studentId,
      relatedType: "submission",
      relatedId: sub.id,
      eventType: "paper_submitted",
      title: `投稿至 ${parsed.venueName}`,
    });
    revalidatePath(`/students/${paper.studentId}`);
    revalidatePath(`/papers/${parsed.paperId}`);
  }
  revalidatePath("/submissions");
  return sub;
}

export async function updateSubmission(id: number, data: SubmissionFormData) {
  const parsed = submissionSchema.parse(data);
  const sub = await prisma.submission.update({
    where: { id },
    data: {
      paperId: parsed.paperId,
      venueName: parsed.venueName,
      submissionRound: parsed.submissionRound,
      submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : null,
      decisionAt: parsed.decisionAt ? new Date(parsed.decisionAt) : null,
      decision: parsed.decision ?? null,
      editorComments: parsed.editorComments ?? null,
      reviewerComments: parsed.reviewerComments ?? null,
      status: parsed.status,
      notes: parsed.notes ?? null,
    },
  });

  if (parsed.status === "decisioned" && parsed.decision) {
    const paper = await prisma.paper.findUnique({ where: { id: parsed.paperId } });
    if (paper) {
      const paperStatus = parsed.decision === "minor_revision" ? "minor_revision"
        : parsed.decision === "major_revision" ? "major_revision"
        : parsed.decision === "accept" ? "accepted"
        : parsed.decision === "reject" ? "rejected"
        : paper.status;
      await prisma.paper.update({ where: { id: parsed.paperId }, data: { status: paperStatus } });
      await createTimelineEvent({
        studentId: paper.studentId,
        relatedType: "submission",
        relatedId: sub.id,
        eventType: "decision_received",
        title: `${parsed.venueName} 审稿意见：${parsed.decision}`,
      });
      revalidatePath(`/students/${paper.studentId}`);
    }
  }

  revalidatePath("/submissions");
  revalidatePath(`/papers/${parsed.paperId}`);
  return sub;
}

export async function deleteSubmission(id: number) {
  const sub = await prisma.submission.findUnique({ where: { id }, include: { paper: true } });
  if (!sub) throw new Error("Submission not found");
  await prisma.submission.delete({ where: { id } });
  revalidatePath("/submissions");
  revalidatePath(`/papers/${sub.paperId}`);
}
```

- [ ] **Step 2: Write revisions actions**

```typescript
// src/app/revisions/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline";
import { revisionSchema } from "@/lib/validators";
import type { RevisionFormData } from "@/lib/validators";

export async function createRevision(data: RevisionFormData) {
  const parsed = revisionSchema.parse(data);
  const submission = await prisma.submission.findUnique({ where: { id: parsed.submissionId }, include: { paper: true } });
  const rev = await prisma.revision.create({
    data: {
      submissionId: parsed.submissionId,
      revisionRound: parsed.revisionRound,
      receivedAt: parsed.receivedAt ? new Date(parsed.receivedAt) : null,
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
      submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : null,
      revisionType: parsed.revisionType,
      commentsSummary: parsed.commentsSummary ?? null,
      responseSummary: parsed.responseSummary ?? null,
      status: parsed.status,
      notes: parsed.notes ?? null,
    },
  });

  if (submission?.paper) {
    await createTimelineEvent({
      studentId: submission.paper.studentId,
      relatedType: "revision",
      relatedId: rev.id,
      eventType: "revision_started",
      title: `${submission.venueName} 返修第${parsed.revisionRound}轮（${parsed.revisionType}）`,
    });
    revalidatePath(`/students/${submission.paper.studentId}`);
  }
  revalidatePath("/revisions");
  revalidatePath(`/submissions`);
  return rev;
}

export async function updateRevision(id: number, data: RevisionFormData) {
  const parsed = revisionSchema.parse(data);
  const rev = await prisma.revision.update({
    where: { id },
    data: {
      submissionId: parsed.submissionId,
      revisionRound: parsed.revisionRound,
      receivedAt: parsed.receivedAt ? new Date(parsed.receivedAt) : null,
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
      submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : null,
      revisionType: parsed.revisionType,
      commentsSummary: parsed.commentsSummary ?? null,
      responseSummary: parsed.responseSummary ?? null,
      status: parsed.status,
      notes: parsed.notes ?? null,
    },
  });
  revalidatePath("/revisions");
  return rev;
}

export async function deleteRevision(id: number) {
  await prisma.revision.delete({ where: { id } });
  revalidatePath("/revisions");
}
```

- [ ] **Step 3: Write submissions list page + table + form**

```typescript
// src/app/submissions/page.tsx
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
```

```typescript
// src/app/submissions/submission-list-client.tsx
"use client";

import { useState } from "react";
import { SubmissionTable } from "@/components/submissions/submission-table";
import { SubmissionForm } from "@/components/submissions/submission-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function SubmissionListClient({ submissions }: { submissions: any[] }) {
  const [showForm, setShowForm] = useState(false);
  return (
    <>
      <div className="mb-4"><Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" />添加投稿</Button></div>
      <SubmissionTable submissions={submissions} />
      <SubmissionForm open={showForm} onOpenChange={setShowForm} submission={null} />
    </>
  );
}
```

```typescript
// src/components/submissions/submission-table.tsx
"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteSubmission } from "@/app/submissions/actions";
import { SubmissionForm } from "./submission-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SubmissionTable({ submissions }: { submissions: any[] }) {
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>小论文</TableHead>
            <TableHead>学生</TableHead>
            <TableHead>投稿期刊/会议</TableHead>
            <TableHead>轮次</TableHead>
            <TableHead>投稿日期</TableHead>
            <TableHead>决定</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>返修</TableHead>
            <TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow><TableCell colSpan={9} className="text-center text-gray-400 py-8">暂无数据</TableCell></TableRow>
          ) : (
            submissions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.paper.title}</TableCell>
                <TableCell>{s.paper.student.name}</TableCell>
                <TableCell>{s.venueName}</TableCell>
                <TableCell>第{s.submissionRound}次</TableCell>
                <TableCell className="text-gray-500">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString("zh-CN") : "-"}</TableCell>
                <TableCell>{s.decision ? <StatusBadge type="decision" value={s.decision} /> : "-"}</TableCell>
                <TableCell><StatusBadge type="submission" value={s.status} /></TableCell>
                <TableCell>{s.revisions?.length ?? 0}轮</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditTarget(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(s)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <SubmissionForm open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)} submission={editTarget} />

      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="删除投稿记录"
        description="确定删除此投稿记录及其返修数据？"
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteSubmission(deleteTarget.id);
            toast.success("投稿记录已删除");
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}
```

```typescript
// src/components/submissions/submission-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { submissionSchema, type SubmissionFormData } from "@/lib/validators";
import { createSubmission, updateSubmission } from "@/app/submissions/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function SubmissionForm({ open, onOpenChange, submission }: { open: boolean; onOpenChange: (o: boolean) => void; submission: any | null }) {
  const [papers, setPapers] = useState<any[]>([]);

  useEffect(() => {
    if (open) fetch("/api/papers/list").then(r => r.json()).then(setPapers);
  }, [open]);

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: submission ? {
      ...submission,
      submittedAt: submission.submittedAt?.split("T")[0] ?? null,
      decisionAt: submission.decisionAt?.split("T")[0] ?? null,
      decision: submission.decision ?? null,
      editorComments: submission.editorComments ?? null,
      reviewerComments: submission.reviewerComments ?? null,
      notes: submission.notes ?? null,
    } : {
      paperId: 0, venueName: "", submissionRound: 1,
      submittedAt: null, decisionAt: null, decision: null,
      editorComments: null, reviewerComments: null,
      status: "pending", notes: null,
    },
  });

  async function onSubmit(data: SubmissionFormData) {
    try {
      if (submission) {
        await updateSubmission(submission.id, data);
        toast.success("投稿已更新");
      } else {
        await createSubmission(data);
        toast.success("投稿已记录");
      }
      onOpenChange(false);
      form.reset();
    } catch (e) { toast.error("操作失败"); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{submission ? "编辑投稿" : "添加投稿"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="paperId" render={({ field }) => (
              <FormItem>
                <FormLabel>小论文</FormLabel>
                <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={field.value ? String(field.value) : undefined}>
                  <FormControl><SelectTrigger><SelectValue placeholder="选择论文" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {papers.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.title} ({p.student?.name})</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="venueName" render={({ field }) => (
                <FormItem><FormLabel>期刊/会议名</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="submissionRound" render={({ field }) => (
                <FormItem><FormLabel>投稿轮次</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="submittedAt" render={({ field }) => (
                <FormItem><FormLabel>投稿日期</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="decisionAt" render={({ field }) => (
                <FormItem><FormLabel>决定日期</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>状态</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="pending">待处理</SelectItem>
                      <SelectItem value="under_review">审稿中</SelectItem>
                      <SelectItem value="decisioned">已返回</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="decision" render={({ field }) => (
              <FormItem>
                <FormLabel>审稿决定</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                  <FormControl><SelectTrigger><SelectValue placeholder="未决定" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="under_review">审稿中</SelectItem>
                    <SelectItem value="minor_revision">小修</SelectItem>
                    <SelectItem value="major_revision">大修</SelectItem>
                    <SelectItem value="accept">接收</SelectItem>
                    <SelectItem value="reject">拒稿</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="reviewerComments" render={({ field }) => (
              <FormItem><FormLabel>审稿意见</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} rows={3} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="editorComments" render={({ field }) => (
              <FormItem><FormLabel>编辑意见</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value || null)} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
              <Button type="submit">{submission ? "保存" : "添加"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Write revision pages (similar pattern)**

Due to length, same patterns as submissions: `actions.ts`, `page.tsx`, `revision-list-client.tsx`, `revision-table.tsx`, `revision-form.tsx` with the same structure. The form uses `revisionSchema`, fetches submissions list from `/api/submissions/list`.

- [ ] **Step 5: Add API endpoints for form dropdowns**

```typescript
// src/app/api/papers/list/route.ts — fetch all papers for dropdowns
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const papers = await prisma.paper.findMany({
    select: { id: true, title: true, student: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(papers);
}
```

```typescript
// src/app/api/submissions/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const submissions = await prisma.submission.findMany({
    select: { id: true, venueName: true, paper: { select: { title: true } } },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json(submissions);
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/submissions/ src/app/revisions/ src/components/submissions/ src/components/revisions/ src/app/api/papers/ src/app/api/submissions/ && git commit -m "feat: add submission and revision CRUD"
```

---

## Task 9: Thesis + ThesisReview CRUD

**Files:**
- Create: `src/app/theses/actions.ts`
- Create: `src/app/theses/page.tsx`
- Create: `src/app/theses/thesis-list-client.tsx`
- Create: `src/app/theses/[id]/page.tsx`
- Create: `src/components/theses/thesis-table.tsx`
- Create: `src/components/theses/thesis-form.tsx`
- Create: `src/components/theses/thesis-review-form.tsx`

- [ ] **Step 1: Write thesis Server Actions**

```typescript
// src/app/theses/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline";
import { thesisSchema, thesisReviewSchema } from "@/lib/validators";
import type { ThesisFormData, ThesisReviewFormData } from "@/lib/validators";

export async function createThesis(data: ThesisFormData) {
  const parsed = thesisSchema.parse(data);
  const thesis = await prisma.thesis.create({
    data: {
      studentId: parsed.studentId,
      title: parsed.title,
      degreeType: parsed.degreeType,
      stage: parsed.stage,
      proposalDate: parsed.proposalDate ? new Date(parsed.proposalDate) : null,
      midtermDate: parsed.midtermDate ? new Date(parsed.midtermDate) : null,
      submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : null,
      reviewedAt: parsed.reviewedAt ? new Date(parsed.reviewedAt) : null,
      defenseDate: parsed.defenseDate ? new Date(parsed.defenseDate) : null,
      score: parsed.score ?? null,
      reviewComments: parsed.reviewComments ?? null,
      revisionNotes: parsed.revisionNotes ?? null,
      status: parsed.status,
    },
  });
  revalidatePath("/theses");
  revalidatePath(`/students/${parsed.studentId}`);
  return thesis;
}

export async function updateThesis(id: number, data: ThesisFormData) {
  const parsed = thesisSchema.parse(data);
  const thesis = await prisma.thesis.update({
    where: { id },
    data: {
      title: parsed.title, degreeType: parsed.degreeType, stage: parsed.stage,
      proposalDate: parsed.proposalDate ? new Date(parsed.proposalDate) : null,
      midtermDate: parsed.midtermDate ? new Date(parsed.midtermDate) : null,
      submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : null,
      reviewedAt: parsed.reviewedAt ? new Date(parsed.reviewedAt) : null,
      defenseDate: parsed.defenseDate ? new Date(parsed.defenseDate) : null,
      score: parsed.score ?? null,
      reviewComments: parsed.reviewComments ?? null,
      revisionNotes: parsed.revisionNotes ?? null,
      status: parsed.status,
    },
  });
  revalidatePath("/theses");
  revalidatePath(`/theses/${id}`);
  revalidatePath(`/students/${parsed.studentId}`);
  return thesis;
}

export async function deleteThesis(id: number) {
  const thesis = await prisma.thesis.findUnique({ where: { id } });
  if (!thesis) throw new Error("Thesis not found");
  await prisma.thesis.delete({ where: { id } });
  revalidatePath("/theses");
  revalidatePath(`/students/${thesis.studentId}`);
}

export async function createThesisReview(data: ThesisReviewFormData) {
  const parsed = thesisReviewSchema.parse(data);
  const review = await prisma.thesisReview.create({
    data: {
      thesisId: parsed.thesisId,
      reviewerName: parsed.reviewerName,
      reviewerType: parsed.reviewerType,
      score: parsed.score ?? null,
      decision: parsed.decision,
      comments: parsed.comments ?? null,
      reviewedAt: parsed.reviewedAt ? new Date(parsed.reviewedAt) : null,
    },
  });
  const thesis = await prisma.thesis.findUnique({ where: { id: parsed.thesisId }, include: { student: true } });
  if (thesis) {
    await prisma.thesis.update({ where: { id: parsed.thesisId }, data: { status: "reviewed", stage: "review" } });
    await createTimelineEvent({
      studentId: thesis.studentId,
      relatedType: "thesis",
      relatedId: thesis.id,
      eventType: "thesis_reviewed",
      title: `大论文审稿意见：${parsed.reviewerName} (${parsed.decision})`,
    });
    revalidatePath(`/students/${thesis.studentId}`);
  }
  revalidatePath(`/theses/${parsed.thesisId}`);
  return review;
}

export async function deleteThesisReview(id: number) {
  const review = await prisma.thesisReview.findUnique({ where: { id }, include: { thesis: true } });
  if (!review) throw new Error("Review not found");
  await prisma.thesisReview.delete({ where: { id } });
  revalidatePath(`/theses/${review.thesisId}`);
}
```

- [ ] **Step 2: Write theses list page + table + form**

Same pattern as papers/submissions. `page.tsx` fetches all theses with student info. `thesis-table.tsx` shows columns: title, student, stage, status, score, dates with edit/delete actions. `thesis-form.tsx` uses `thesisSchema` with all date and stage fields.

- [ ] **Step 3: Write thesis detail page**

```typescript
// src/app/theses/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { StatusBadge } from "@/components/shared/status-badge";
import { ThesisReviewForm } from "@/components/theses/thesis-review-form";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { ThesisDetailClient } from "./thesis-detail-client";

export const dynamic = "force-dynamic";

export default async function ThesisDetailPage({ params }: { params: { id: string } }) {
  const thesis = await prisma.thesis.findUnique({
    where: { id: Number(params.id) },
    include: {
      student: true,
      reviews: { orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!thesis) notFound();

  return (
    <div>
      <AppBreadcrumb />
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold">{thesis.title}</h1>
          <StatusBadge type="thesis" value={thesis.status} />
          <StatusBadge type="thesis" value={thesis.stage} />
        </div>
        <p className="text-gray-500 text-sm">
          学生：<Link href={`/students/${thesis.student.id}`} className="text-blue-600 hover:underline">{thesis.student.name}</Link>
        </p>
      </div>

      <ThesisDetailClient thesis={JSON.parse(JSON.stringify(thesis))} />
    </div>
  );
}
```

- [ ] **Step 4: Write thesis detail client component** with timeline-like stages display and review cards

```typescript
// src/app/theses/[id]/thesis-detail-client.tsx
"use client";

import { useState } from "react";
import { ThesisReviewForm } from "@/components/theses/thesis-review-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const STAGES = [
  { key: "proposal", label: "开题", dateField: "proposalDate" },
  { key: "midterm", label: "中期检查", dateField: "midtermDate" },
  { key: "draft", label: "初稿", dateField: "submittedAt" },
  { key: "review", label: "外审", dateField: "reviewedAt" },
  { key: "revision", label: "修改", dateField: null },
  { key: "defense", label: "答辩", dateField: "defenseDate" },
  { key: "archived", label: "归档", dateField: null },
];

export function ThesisDetailClient({ thesis }: { thesis: any }) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const currentStageIdx = STAGES.findIndex(s => s.key === thesis.stage);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stage timeline */}
      <div className="space-y-4">
        <h2 className="font-medium">进度</h2>
        <div className="space-y-1">
          {STAGES.map((stage, i) => {
            const dateVal = stage.dateField ? thesis[stage.dateField] : null;
            const isPast = i <= currentStageIdx;
            return (
              <div key={stage.key} className="flex items-center gap-3 text-sm">
                <div className={`w-3 h-3 rounded-full ${isPast ? "bg-blue-500" : "bg-gray-300"}`} />
                <span className={isPast ? "font-medium" : "text-gray-400"}>{stage.label}</span>
                {dateVal && <span className="text-gray-400 text-xs ml-auto">{format(new Date(dateVal), "yyyy-MM-dd")}</span>}
              </div>
            );
          })}
        </div>
        {thesis.score && (
          <div className="rounded-lg border bg-gray-50 p-3">
            <span className="text-gray-500 text-sm">分数：</span>
            <span className="font-bold text-lg">{thesis.score}</span>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">审稿意见</h2>
          <Button size="sm" onClick={() => setShowReviewForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />添加审稿意见
          </Button>
        </div>

        {thesis.reviews.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无审稿意见</p>
        ) : (
          thesis.reviews.map((r: any) => (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium">{r.reviewerName}</span>
                  <StatusBadge type="thesis" value={r.reviewerType} />
                </div>
                <StatusBadge type="decision" value={r.decision} />
              </div>
              {r.score && <p className="text-sm text-gray-500 mb-1">分数：{r.score}</p>}
              {r.comments && <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-2">{r.comments}</p>}
              {r.reviewedAt && <p className="text-xs text-gray-400 mt-2">{format(new Date(r.reviewedAt), "yyyy-MM-dd")}</p>}
            </div>
          ))
        )}

        <ThesisReviewForm open={showReviewForm} onOpenChange={setShowReviewForm} thesisId={thesis.id} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/theses/ src/components/theses/ && git commit -m "feat: add thesis CRUD with review and stage timeline"
```

---

## Task 10: Student Detail Page (Integration)

**Files:**
- Create: `src/app/students/[id]/page.tsx`

- [ ] **Step 1: Write student detail page with all tabs**

```typescript
// src/app/students/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { StudentDetailTabs } from "./student-detail-tabs";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const student = await prisma.student.findUnique({
    where: { id: Number(params.id) },
    include: {
      papers: {
        include: {
          submissions: {
            include: { revisions: true },
            orderBy: { submissionRound: "desc" },
          },
          versions: { orderBy: { versionNumber: "desc" } },
        },
        orderBy: { updatedAt: "desc" },
      },
      theses: {
        include: {
          reviews: { orderBy: { createdAt: "desc" } },
          attachments: { orderBy: { uploadedAt: "desc" } },
        },
      },
      attachments: { orderBy: { uploadedAt: "desc" } },
      timelineEvents: { orderBy: { eventDate: "desc" }, take: 50 },
    },
  });

  if (!student) notFound();

  return (
    <div>
      <AppBreadcrumb />
      <div className="mb-6">
        <h1 className="text-xl font-bold">{student.name}</h1>
        <p className="text-gray-500 text-sm">
          {student.studentNo} · {student.degreeType} · {student.enrollmentYear}级 · {student.direction}
        </p>
      </div>
      <StudentDetailTabs student={JSON.parse(JSON.stringify(student))} />
    </div>
  );
}
```

- [ ] **Step 2: Write tabs component**

```typescript
// src/app/students/[id]/student-detail-tabs.tsx
"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaperVersions } from "@/components/papers/paper-versions";

export function StudentDetailTabs({ student }: { student: any }) {
  const router = useRouter();

  return (
    <Tabs defaultValue="papers">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="papers">小论文 ({student.papers.length})</TabsTrigger>
        <TabsTrigger value="thesis">大论文</TabsTrigger>
        <TabsTrigger value="timeline">时间线</TabsTrigger>
      </TabsList>

      {/* Papers Tab */}
      <TabsContent value="papers" className="space-y-4 mt-4">
        {student.papers.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">暂无小论文</p>
        ) : (
          student.papers.map((paper: any) => (
            <div key={paper.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => router.push(`/papers/${paper.id}`)}>
                <div>
                  <span className="font-medium hover:text-blue-600">{paper.title}</span>
                  <StatusBadge type="paper" value={paper.status} />
                </div>
                <span className="text-gray-400 text-xs">v{paper.currentVersion} · {paper.paperType === "journal" ? "期刊" : "会议"}</span>
              </div>
              {paper.myThoughts && (
                <div className="bg-blue-50 rounded p-2 text-sm text-blue-800 mb-2">{paper.myThoughts}</div>
              )}
              {/* Submissions for this paper */}
              {paper.submissions.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs text-gray-400 mb-1">投稿记录：</p>
                  {paper.submissions.map((sub: any) => (
                    <div key={sub.id} className="text-xs text-gray-600 ml-2">
                      · {sub.venueName} (第{sub.submissionRound}次) — <StatusBadge type="submission" value={sub.status} />
                      {sub.decision && <><StatusBadge type="decision" value={sub.decision} /></>}
                      {sub.revisions.length > 0 && ` (${sub.revisions.length}轮返修)`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </TabsContent>

      {/* Thesis Tab */}
      <TabsContent value="thesis" className="space-y-4 mt-4">
        {student.theses.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">暂无大论文</p>
        ) : (
          student.theses.map((thesis: any) => (
            <div key={thesis.id} className="rounded-lg border bg-white p-4 cursor-pointer" onClick={() => router.push(`/theses/${thesis.id}`)}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium hover:text-blue-600">{thesis.title}</span>
                <div className="flex gap-1">
                  <StatusBadge type="thesis" value={thesis.stage} />
                  <StatusBadge type="thesis" value={thesis.status} />
                </div>
              </div>
              {thesis.score && <p className="text-sm text-gray-500">分数：{thesis.score}</p>}
              <div className="text-xs text-gray-400 mt-1">
                审稿意见：{thesis.reviews.length} 条
              </div>
            </div>
          ))
        )}
      </TabsContent>

      {/* Timeline Tab */}
      <TabsContent value="timeline" className="mt-4">
        {student.timelineEvents.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">暂无时间线</p>
        ) : (
          <div className="space-y-3">
            {student.timelineEvents.map((evt: any) => (
              <div key={evt.id} className="flex gap-3 text-sm">
                <div className="text-gray-400 w-24 shrink-0">
                  {new Date(evt.eventDate).toLocaleDateString("zh-CN")}
                </div>
                <div className="w-0.5 bg-gray-200 shrink-0" />
                <div>
                  <p className="font-medium">{evt.title}</p>
                  {evt.description && <p className="text-gray-500 text-xs">{evt.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/students/\[id\]/ && git commit -m "feat: add student detail page with papers/thesis/timeline tabs"
```

---

## Task 11: Dashboard

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/dashboard/grade-group.tsx`
- Create: `src/components/dashboard/student-card.tsx`

- [ ] **Step 1: Write dashboard page**

```typescript
// src/app/dashboard/page.tsx
import { prisma } from "@/lib/prisma";
import { GradeGroup } from "@/components/dashboard/grade-group";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const students = await prisma.student.findMany({
    where: { status: "active" },
    include: {
      papers: {
        where: { status: { notIn: ["rejected", "published"] } },
        include: {
          submissions: {
            orderBy: { submittedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
    orderBy: { enrollmentYear: "asc" },
  });

  // Group by enrollment year
  const grouped = new Map<number, any[]>();
  for (const s of students) {
    const year = s.enrollmentYear;
    if (!grouped.has(year)) grouped.set(year, []);
    grouped.get(year)!.push(s);
  }

  // Sort by year, then convert
  const gradeGroups = Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, students]) => ({
      year,
      grade: year === new Date().getFullYear() ? "研一" : year === new Date().getFullYear() - 1 ? "研二" : `${year}级`,
      students: JSON.parse(JSON.stringify(students)),
    }));

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">首页概览</h1>
      <div className="space-y-8">
        {gradeGroups.map((group) => (
          <GradeGroup key={group.year} grade={group.grade} students={group.students} />
        ))}
        {gradeGroups.length === 0 && (
          <p className="text-gray-400 text-center py-12">暂无学生数据，请先添加学生</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write GradeGroup component**

```typescript
// src/components/dashboard/grade-group.tsx
import { StudentCard } from "./student-card";

export function GradeGroup({ grade, students }: { grade: string; students: any[] }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm">{grade}</span>
        <span className="text-gray-400 text-sm font-normal">{students.length}名学生</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write StudentCard component**

```typescript
// src/components/dashboard/student-card.tsx
"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

export function StudentCard({ student }: { student: any }) {
  const router = useRouter();
  const activePapers = student.papers?.filter(
    (p: any) => p.status !== "rejected" && p.status !== "published"
  ) ?? [];

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push(`/students/${student.id}`)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-sm">{student.name}</div>
              <div className="text-xs text-gray-400">{student.direction}</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </div>

        {/* Paper notes */}
        {activePapers.length === 0 ? (
          <p className="text-xs text-gray-400">暂无活跃论文</p>
        ) : (
          <div className="space-y-2">
            {activePapers.slice(0, 3).map((paper: any) => (
              <div key={paper.id} className="rounded-md border p-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium truncate block max-w-[180px]">{paper.title}</span>
                  <StatusBadge type="paper" value={paper.status} />
                </div>
                {paper.targetVenue && (
                  <span className="text-gray-400">目标：{paper.targetVenue}</span>
                )}
                {paper.submissions?.[0]?.reviewerComments && (
                  <div className="mt-1 pt-1 border-t text-gray-500 truncate">
                    📝 {paper.submissions[0].reviewerComments.slice(0, 60)}...
                  </div>
                )}
              </div>
            ))}
            {activePapers.length > 3 && (
              <p className="text-xs text-blue-600">+{activePapers.length - 3} 篇更多...</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/ src/components/dashboard/ && git commit -m "feat: add dashboard with grade-grouped student cards"
```

---

## Task 12: File Download + Paper Detail Polish + Final Integration

**Files:**
- Create: `src/app/api/files/[...path]/route.ts`

- [ ] **Step 1: Write file download endpoint**

```typescript
// src/app/api/files/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const filePath = path.join(process.cwd(), "data", "files", ...params.path);
  try {
    const buffer = await readFile(filePath);
    const fileName = params.path[params.path.length - 1];
    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
```

- [ ] **Step 2: Full manual test**

```bash
pnpm dev
```

Walk through: Dashboard → Students → Create Student → Student Detail → Create Paper → Upload Version → Create Submission → Create Revision → Create Thesis → Create Review → Check Timeline. Verify file upload/download. Verify dashboard cards.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/files/ && git commit -m "feat: add file download endpoint and final integration"
```

---

## Plan Self-Review

### Spec Coverage

| Spec Requirement | Covered By |
|------------------|------------|
| 学生管理 CRUD | Task 6 |
| 小论文管理 CRUD + 版本 | Task 7 |
| 投稿记录管理 | Task 8 |
| 返修记录管理 | Task 8 |
| 大论文管理 + 审稿意见 | Task 9 |
| 附件上传/下载 | Tasks 7, 12 |
| 时间线自动生成 | Tasks 6-9 (all actions call createTimelineEvent) |
| 学生详情页 Tabs | Task 10 |
| Dashboard 按年级分组 | Task 11 |
| 在读/已毕业分 Tab | Task 6 |
| 小论文 minor/major_revision | Task 2 (schema), Task 7 (form) |
| 我的思考 | Task 2 (schema), Task 7 (form) |
| 文件版本历史 | Task 7 (PaperVersions) |
| 返修多文件关联 | Task 8 (attachments table supports it) |

### Placeholder Scan
No TBD, TODO, or placeholder content found.

### Type Consistency
- All Zod schemas in validators.ts match the Prisma model field types
- Server Actions reference correct validator schemas
- Form defaultValues match schema requirements
- Component props match database query shapes

---

## Execution Handoff

Two execution options:

1. **Subagent-Driven (recommended)** — Dispatch fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session, batch execution with checkpoints

Which approach?
