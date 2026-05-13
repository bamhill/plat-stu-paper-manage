import { z } from "zod";

export const studentSchema = z.object({
  name: z.string().min(1, "姓名不能为空"),
  studentNo: z.string().min(1, "学号不能为空"),
  degreeType: z.string().min(1, "学位类型不能为空"),
  enrollmentYear: z.coerce.number().int().min(2000).max(2100),
  graduationYear: z.coerce.number().int().min(2000).max(2100).nullable().optional(),
  direction: z.string().min(1, "方向不能为空"),
  supervisor: z.string().min(1, "导师不能为空"),
  coSupervisor: z.string().nullable().optional(),
  status: z.enum(["active", "graduated", "delayed", "suspended"]),
  notes: z.string().nullable().optional(),
});

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

export const thesisReviewSchema = z.object({
  thesisId: z.coerce.number().int(),
  reviewerName: z.string().min(1, "审稿人不能为空"),
  reviewerType: z.enum(["internal", "external", "anonymous"]),
  score: z.string().nullable().optional(),
  decision: z.enum(["pass", "minor_revision", "major_revision", "fail"]),
  comments: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
});

export type StudentFormData = z.infer<typeof studentSchema>;
export type PaperFormData = z.infer<typeof paperSchema>;
export type SubmissionFormData = z.infer<typeof submissionSchema>;
export type RevisionFormData = z.infer<typeof revisionSchema>;
export type ThesisFormData = z.infer<typeof thesisSchema>;
export type ThesisReviewFormData = z.infer<typeof thesisReviewSchema>;
