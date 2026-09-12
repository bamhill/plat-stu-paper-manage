import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { StudentListTabs } from "./student-list-tabs";
import { requireTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudentsPage({ searchParams }: { searchParams?: { status?: string } }) {
  const teacher = await requireTeacher();
  const activeStudents = await prisma.student.findMany({
    where: { teacherId: teacher.id, status: { not: "graduated" } },
    orderBy: [{ enrollmentYear: "desc" }, { name: "asc" }],
    include: { _count: { select: { papers: true, theses: true } } },
  });
  const graduatedStudents = await prisma.student.findMany({
    where: { teacherId: teacher.id, status: "graduated" },
    orderBy: [{ graduationYear: "desc" }, { name: "asc" }],
    include: { _count: { select: { papers: true, theses: true } } },
  });

  const allDegreeTypes = await prisma.student.findMany({
    where: { teacherId: teacher.id },
    select: { degreeType: true },
    distinct: ["degreeType"],
    orderBy: { degreeType: "asc" },
  });

  const activePapers = activeStudents.reduce((n, s) => n + (s._count?.papers || 0), 0);
  const activeTheses = activeStudents.reduce((n, s) => n + (s._count?.theses || 0), 0);

  return (
    <div>
      <PageHeader
        title="学生"
        description="按培养状态、学位类型和论文进展查看学生；学生详情是论文推进的人员入口。"
        stats={[
          { label: "在读学生", value: activeStudents.length, hint: "当前培养中的学生", href: "/students?status=active" },
          { label: "已毕业", value: graduatedStudents.length, hint: "历史学生仍可查询", href: "/students?status=graduated" },
          { label: "在读学生小论文", value: activePapers, hint: "包含投稿历史", href: "/papers?scope=activeStudents" },
          { label: "在读学生大论文", value: activeTheses, hint: "开题至答辩全过程", href: "/theses?scope=activeStudents" },
        ]}
      />
      <StudentListTabs
        activeStudents={serialize(activeStudents)}
        graduatedStudents={serialize(graduatedStudents)}
        degreeTypes={allDegreeTypes.map((d) => d.degreeType)}
        initialStatus={searchParams?.status || "全部"}
      />
    </div>
  );
}
