import { PageHeader } from "@/components/layout/page-header";
import { ImportClient } from "./import-client";
import { requireTeacher } from "@/lib/auth";

export default async function ImportPage() {
  await requireTeacher();
  return (
    <div>
      <PageHeader title="批量导入" description="用于一次性接入历史学生、论文与投稿数据；日常推进仍在对应业务页面完成。" />
      <section className="paper-panel"><div className="paper-panel-body"><ImportClient /></div></section>
    </div>
  );
}
