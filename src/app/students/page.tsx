import { prisma } from "@/lib/prisma";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
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
