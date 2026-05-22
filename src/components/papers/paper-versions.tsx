"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addPaperVersion } from "@/app/papers/actions";
import { formatSize } from "@/lib/utils";
import { Upload, Download } from "lucide-react";

type Version = {
  id: number; versionNumber: number; fileName: string;
  filePath: string; fileSize: number; description: string | null; uploadedAt: string | Date;
};

export function PaperVersions({ paperId, versions }: { paperId: number; versions: Version[] }) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "papers");
    formData.append("entityId", String(paperId));
    try {
      const res = await fetch("/api/files/upload", { method: "POST", body: formData });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const result = await res.json();
      await addPaperVersion(paperId, result.fileName, result.filePath, result.fileSize);
      toast.success("新版本上传成功");
    } catch (e: any) { toast.error(e.message || "上传失败"); }
    finally { setUploading(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">版本历史</h3>
        <label className="cursor-pointer inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">
          <Upload className="h-3.5 w-3.5 mr-1" />{uploading ? "上传中..." : "上传新版本"}
          <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx" />
        </label>
      </div>
      {versions.length === 0 ? (
        <p className="text-gray-400 text-sm">暂无版本</p>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <div>
                <span className="font-medium">v{v.versionNumber}</span>
                <span className="ml-2 text-gray-600">{v.fileName}</span>
                <span className="ml-2 text-gray-400">{formatSize(v.fileSize)}</span>
                {v.description && <span className="ml-2 text-gray-400">— {v.description}</span>}
              </div>
              <a href={`/api/files/${v.filePath}`} download className="text-blue-600 hover:text-blue-800">
                <Download className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
