import { PageHeader } from "@/components/layout/page-header";
import { SettingsClient } from "./settings-client";
import { requireTeacher } from "@/lib/auth";

export default async function SettingsPage() {
  await requireTeacher();
  return (
    <div>
      <PageHeader title="系统设置" description="文件、学位类型、AI任务包与首页显示。" />
      <SettingsClient />
    </div>
  );
}
