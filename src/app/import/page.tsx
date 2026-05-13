import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { ImportClient } from "./import-client";

export default function ImportPage() {
  return (
    <div>
      <AppBreadcrumb />
      <h1 className="text-xl font-bold mb-4">批量导入</h1>
      <ImportClient />
    </div>
  );
}
