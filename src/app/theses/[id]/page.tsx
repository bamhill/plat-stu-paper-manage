import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { StatusBadge } from "@/components/shared/status-badge";
import Link from "next/link";
import { ThesisDetailClient } from "./thesis-detail-client";

export const dynamic = "force-dynamic";

export default async function ThesisDetailPage({ params }: { params: { id: string } }) {
  const thesis = await prisma.thesis.findUnique({
    where: { id: Number(params.id) },
    include: {
      student: true,
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!thesis) notFound();

  const thesisAttachments = await prisma.attachment.findMany({
    where: { relatedType: "thesis", relatedId: Number(params.id) },
    orderBy: { uploadedAt: "desc" },
  });

  // Also fetch attachments for each review
  const reviewIds = thesis.reviews.map(r => r.id);
  const reviewAttachments = reviewIds.length > 0 ? await prisma.attachment.findMany({
    where: { relatedType: "thesis_review", relatedId: { in: reviewIds } },
    orderBy: { uploadedAt: "desc" },
  }) : [];

  // Merge review attachments into review objects
  const reviewsWithAttachments = thesis.reviews.map(r => ({
    ...r,
    attachments: reviewAttachments.filter(a => a.relatedId === r.id),
  }));

  return (
    <div>
      <AppBreadcrumb />
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold">{thesis.title}</h1>
          <StatusBadge value={thesis.status} />
          <StatusBadge value={thesis.stage} />
        </div>
        <p className="text-gray-500 text-sm">
          学生：<Link href={`/students/${thesis.student.id}`} className="text-blue-600 hover:underline">{thesis.student.name}</Link>
        </p>
      </div>
      <ThesisDetailClient thesis={JSON.parse(JSON.stringify({ ...thesis, reviews: reviewsWithAttachments, attachments: thesisAttachments }))} />
    </div>
  );
}
