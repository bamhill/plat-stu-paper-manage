"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload } from "lucide-react";

export function ImportClient() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResults([]);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      setResults(data.results || []);
      toast.success("导入完成");
    } catch { toast.error("导入失败"); }
    finally { setUploading(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader><CardTitle>导入数据</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            下载 Excel 模板，按模板格式填写数据后上传。支持同时导入学生、小论文、投稿记录、返修记录。
          </p>
          <div className="flex gap-4">
            <a href="/api/import/template" download>
              <Button variant="outline"><Download className="h-4 w-4 mr-2" />下载模板</Button>
            </a>
            <label>
              <Button disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "导入中..." : "上传并导入"}
              </Button>
              <input type="file" className="hidden" onChange={handleUpload} accept=".xlsx,.xls" />
            </label>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader><CardTitle>导入结果</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {results.map((r, i) => (
                <p key={i} className={r.includes("失败") ? "text-red-600" : "text-green-600"}>{r}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
