import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { ThesisListClient } from "./thesis-list-client";
import { requireTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ThesesPage({ searchParams }: { searchParams?: { view?: string; scope?: string } }) {
  const teacher = await requireTeacher();
  const theses = await prisma.thesis.findMany({
    where: { student: { teacherId: teacher.id } },
    include: { student: { select: { name: true, status: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const inProgress = theses.filter((t) => t.status === "in_progress").length;
  const reviewing = theses.filter((t) => ["review", "external_review"].includes(t.stage)).length;
  const defense = theses.filter((t) => ["defense", "defended"].includes(t.stage) || !!t.defenseDate).length;
  const completed = theses.filter((t) => ["completed", "graduated"].includes(t.status)).length;

  return (
    <div>
      <PageHeader
        title="大论文"
        description="按开题、中期、送审和答辩推进学位论文；外审成绩与修改记录集中在大论文详情。"
        stats={[
          { label: "大论文", value: theses.length, hint: "当前系统全部记录", href: "/theses" },
          { label: "进行中", value: inProgress, hint: "尚未完成培养流程", href: "/theses?view=progress" },
          { label: "送审阶段", value: reviewing, hint: "外审相关节点", href: "/theses?view=review" },
          { label: "答辩/完成", value: defense + completed, hint: "已进入培养后段", href: "/theses?view=defense" },
        ]}
      />
      <ThesisListClient theses={serialize(theses)} initialView={searchParams?.view || "all"} initialScope={searchParams?.scope || ""} />
    </div>
  );
}
