import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import { GradeGroup } from "@/components/dashboard/grade-group";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const settings = getSettings();
  const statusFilter = settings.dashboardStatusFilter?.length ? settings.dashboardStatusFilter : undefined;

  const students = await prisma.student.findMany({
    where: { status: "active", showOnDashboard: { not: false } },
    include: {
      papers: {
        where: statusFilter ? { status: { in: statusFilter } } : undefined,
        include: {
          submissions: { orderBy: { submittedAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
    orderBy: { enrollmentYear: "asc" },
  });

  const grouped = new Map<number, any[]>();
  for (const s of students) {
    const year = s.enrollmentYear;
    if (!grouped.has(year)) grouped.set(year, []);
    grouped.get(year)!.push(s);
  }

  const gradeGroups = Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, students]) => {
      const grade = `${year}级`;
      return { year, grade, students: serialize(students) };
    });

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">首页概览</h1>
      <div className="space-y-8">
        {gradeGroups.map((group) => (
          <GradeGroup key={group.year} grade={group.grade} students={group.students} />
        ))}
        {gradeGroups.length === 0 && (
          <p className="text-gray-400 text-center py-12">暂无在读学生数据，请先添加学生</p>
        )}
      </div>
    </div>
  );
}
