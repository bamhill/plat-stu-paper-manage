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
      <ThesisDetailClient thesis={JSON.parse(JSON.stringify(thesis))} />
    </div>
  );
}
