import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StudentDetailTabs } from "./student-detail-tabs";
import { getPaperPriorityMeta } from "@/lib/paper-runtime-meta";
import { requireTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const teacher = await requireTeacher();
  const student = await prisma.student.findFirst({
    where: { id: Number(params.id), teacherId: teacher.id },
    include: {
      papers: {
        include: {
          submissions: { include: { revisions: true }, orderBy: { submissionRound: "desc" } },
          versions: { orderBy: { versionNumber: "desc" } },
        },
        orderBy: { updatedAt: "desc" },
      },
      theses: { include: { reviews: { orderBy: { createdAt: "desc" } } } },
      transfersFrom: {
        include: { paper: { include: { student: true } }, toStudent: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!student) notFound();
  const priorityMeta = getPaperPriorityMeta();
  const papers = student.papers.map((p) => ({ ...p, ...(priorityMeta.get(p.id) || { isPriority: false, priorityOrder: null }) }))
    .sort((a, b) => Number(b.isPriority) - Number(a.isPriority) || ((a.priorityOrder ?? 999) - (b.priorityOrder ?? 999)) || b.updatedAt.getTime() - a.updatedAt.getTime());
  const studentView = { ...student, papers };

  const planned = papers.filter((p) => p.status === "ready_to_submit").length;
  const active = papers.filter((p) => ["submitted", "with_editor", "under_review", "minor_revision", "major_revision"].includes(p.status)).length;

  return (
    <div>
      <PageHeader
        title={student.name}
        description={`${student.studentNo} · ${student.degreeType} · ${student.enrollmentYear}级 · ${student.direction} · 导师：${student.supervisor}`}
        stats={[
          { label: "小论文", value: papers.length, hint: "点击论文进入完整投稿历程" },
          { label: "投稿流程中", value: active, hint: "编辑/外审/返修" },
          { label: "待投稿", value: planned, hint: "已有下一步投稿动作" },
          { label: "大论文", value: student.theses.length, hint: "开题至答辩" },
        ]}
      />
      <StudentDetailTabs student={serialize(studentView)} />
    </div>
  );
}
