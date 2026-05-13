import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { SettingsClient } from "./settings-client";

export default function SettingsPage() {
  return (
    <div>
      <AppBreadcrumb />
      <h1 className="text-xl font-bold mb-6">系统设置</h1>
      <SettingsClient />
    </div>
  );
}
