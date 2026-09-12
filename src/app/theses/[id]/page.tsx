import { prisma } from "@/lib/prisma";
import { serialize, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import Link from "next/link";
import { ThesisDetailClient } from "./thesis-detail-client";
import { requireTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ThesisDetailPage({ params }: { params: { id: string } }) {
  const teacher = await requireTeacher();
  const thesis = await prisma.thesis.findFirst({
    where: { id: Number(params.id), student: { teacherId: teacher.id } },
    include: { student: true, reviews: { orderBy: { createdAt: "desc" } } },
  });
  if (!thesis) notFound();

  const thesisAttachments = await prisma.attachment.findMany({
    where: { teacherId: teacher.id, relatedType: "thesis", relatedId: Number(params.id) },
    orderBy: { uploadedAt: "desc" },
  });

  const reviewIds = thesis.reviews.map((r) => r.id);
  const reviewAttachments = reviewIds.length > 0 ? await prisma.attachment.findMany({
    where: { teacherId: teacher.id, relatedType: "thesis_review", relatedId: { in: reviewIds } },
    orderBy: { uploadedAt: "desc" },
  }) : [];

  const reviewsWithAttachments = thesis.reviews.map((r) => ({ ...r, attachments: reviewAttachments.filter((a) => a.relatedId === r.id) }));
  const scored = [thesis.expert1Score, thesis.expert2Score, thesis.expert3Score].filter(Boolean).length;

  return (
    <div>
      <PageHeader
        title={thesis.title}
        description={<>学生：<Link href={`/students/${thesis.student.id}`} className="text-blue-700 hover:underline">{thesis.student.name}</Link> · {thesis.degreeType}</>}
        stats={[
          { label: "当前阶段", value: <span className="text-sm"><StatusBadge value={thesis.stage} /></span>, hint: "培养节点" },
          { label: "当前状态", value: <span className="text-sm"><StatusBadge value={thesis.status} /></span>, hint: "大论文主状态" },
          { label: "外审录入", value: `${scored}/3`, hint: `${thesis.reviews.length} 条评审记录` },
          { label: "答辩", value: thesis.score || "—", hint: thesis.defenseDate ? formatDate(thesis.defenseDate) : "尚未记录答辩日期" },
        ]}
      />
      <ThesisDetailClient thesis={serialize({ ...thesis, reviews: reviewsWithAttachments, attachments: thesisAttachments })} />
    </div>
  );
}
