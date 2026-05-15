"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileText, Trash2 } from "lucide-react";

interface Attachment {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  description: string | null;
  uploadedAt: string;
}

interface Props {
  relatedType: string;
  relatedId: number;
  existingAttachments: Attachment[];
}

export function AttachmentUpload({ relatedType, relatedId, existingAttachments }: Props) {
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>(existingAttachments);
  const [description, setDescription] = useState("");

  // Load existing attachments on mount
  useEffect(() => {
    fetch(`/api/attachments?relatedType=${relatedType}&relatedId=${relatedId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAttachments(data);
        } else if (existingAttachments.length > 0) {
          setAttachments(existingAttachments);
        }
      })
      .catch(() => {
        if (existingAttachments.length > 0) setAttachments(existingAttachments);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relatedType, relatedId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", relatedType); // submission, revision, thesis, thesis_review
    formData.append("entityId", String(relatedId));
    formData.append("description", description || file.name);

    try {
      const res = await fetch("/api/files/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const result = await res.json();
      // Create attachment record
      const attRes = await fetch("/api/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relatedType,
          relatedId,
          fileName: result.fileName,
          filePath: result.filePath,
          fileType: result.fileType,
          fileSize: result.fileSize,
          description: description || null,
        }),
      });
      if (!attRes.ok) throw new Error("创建附件记录失败");
      const newAtt = await attRes.json();
      setAttachments(prev => [newAtt, ...prev]);
      setDescription("");
      toast.success("附件上传成功");
    } catch (e: any) {
      toast.error(e.message || "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label className="text-xs">附件描述</Label>
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="如：审稿意见_01、大修回复_V2"
            className="h-8 text-sm"
          />
        </div>
        <label className="cursor-pointer inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "上传中..." : "上传附件"}
          <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.zip,.rar,.7z" />
        </label>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-gray-400" />
                <span>{att.fileName}</span>
                <span className="text-gray-400">{formatSize(att.fileSize)}</span>
                {att.description && <span className="text-gray-400 text-xs">— {att.description}</span>}
                <span className="text-gray-300 text-xs">{new Date(att.uploadedAt).toLocaleDateString("zh-CN")}</span>
              </div>
              <div className="flex items-center gap-1">
                <a href={`/api/files/${att.filePath}`} download className="text-blue-600 hover:text-blue-800">
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={async () => {
                    if (!confirm("确定删除此附件？")) return;
                    try {
                      const res = await fetch(`/api/attachments?id=${att.id}`, { method: "DELETE" });
                      if (res.ok) {
                        setAttachments(prev => prev.filter(a => a.id !== att.id));
                        toast.success("附件已删除");
                      } else toast.error("删除失败");
                    } catch { toast.error("删除失败"); }
                  }}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
