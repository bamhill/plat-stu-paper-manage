import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
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
          submissions: { include: { revisions: true }, orderBy: { submissionRound: "desc" } },
          versions: { orderBy: { versionNumber: "desc" } },
        },
        orderBy: { updatedAt: "desc" },
      },
      theses: {
        include: { reviews: { orderBy: { createdAt: "desc" } } },
      },
    },
  });
  if (!student) notFound();

  return (
    <div>
      <AppBreadcrumb />
      <div className="mb-6">
        <h1 className="text-xl font-bold">{student.name}</h1>
        <p className="text-gray-500 text-sm">
          {student.studentNo} · {student.degreeType} · {student.enrollmentYear}级 · {student.direction} · 导师：{student.supervisor}
        </p>
      </div>
      <StudentDetailTabs student={serialize(student)} />
    </div>
  );
}
