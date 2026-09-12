"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Pencil } from "lucide-react";

type AiDefaults = {
  includeEditorDecision: boolean;
  includeReviewerComments: boolean;
  includeRevisionHistory: boolean;
  includeSubmissionHistory: boolean;
  includeResponsibilityHistory: boolean;
  includeAttachments: boolean;
};

const DEFAULT_AI: AiDefaults = {
  includeEditorDecision: true,
  includeReviewerComments: true,
  includeRevisionHistory: true,
  includeSubmissionHistory: true,
  includeResponsibilityHistory: true,
  includeAttachments: true,
};

export function SettingsClient() {
  const [fileRootDir, setFileRootDir] = useState("data/files");
  const [organizeByStudent, setOrganizeByStudent] = useState(true);
  const [degreeTypes, setDegreeTypes] = useState<string[]>([]);
  const [newDegreeType, setNewDegreeType] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [aiDefaults, setAiDefaults] = useState<AiDefaults>(DEFAULT_AI);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((data) => {
      if (data.fileRootDir) setFileRootDir(data.fileRootDir);
      if (data.organizeByStudent !== undefined) setOrganizeByStudent(data.organizeByStudent);
      if (data.degreeTypes) setDegreeTypes(data.degreeTypes);
      if (data.aiPackageDefaults) setAiDefaults({ ...DEFAULT_AI, ...data.aiPackageDefaults });
      setLoading(false);
    });
  }, []);

  async function savePatch(patch: Record<string, unknown>, success: string) {
    const res = await fetch("/api/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    });
    if (res.ok) toast.success(success); else toast.error("保存失败");
    return res.ok;
  }

  async function saveFileSettings() {
    await savePatch({ fileRootDir, organizeByStudent }, "文件设置已保存");
  }

  async function addDegreeType() {
    if (!newDegreeType.trim()) return;
    const updated = [...degreeTypes, newDegreeType.trim()];
    if (await savePatch({ degreeTypes: updated }, "学位类型已添加")) {
      setDegreeTypes(updated); setNewDegreeType("");
    }
  }

  async function removeDegreeType(idx: number) {
    const updated = degreeTypes.filter((_, i) => i !== idx);
    if (await savePatch({ degreeTypes: updated }, "学位类型已删除")) setDegreeTypes(updated);
  }

  async function saveDegreeTypeEdit(idx: number) {
    if (!editValue.trim()) return;
    const updated = [...degreeTypes]; updated[idx] = editValue.trim();
    if (await savePatch({ degreeTypes: updated }, "学位类型已更新")) {
      setDegreeTypes(updated); setEditingIdx(null);
    }
  }

  async function saveAiDefaults() {
    await savePatch({ aiPackageDefaults: aiDefaults }, "AI任务包偏好已保存");
  }

  if (loading) return <div className="text-gray-400">加载中...</div>;

  const aiOptions: Array<[keyof AiDefaults, string]> = [
    ["includeEditorDecision", "编辑决定"],
    ["includeReviewerComments", "审稿意见"],
    ["includeRevisionHistory", "返修记录"],
    ["includeSubmissionHistory", "投稿历史"],
    ["includeResponsibilityHistory", "责任交接"],
    ["includeAttachments", "附件清单"],
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader><CardTitle>文件存储</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>附件存储目录</Label>
            <div className="flex gap-2 mt-1">
              <Input value={fileRootDir} onChange={(e) => setFileRootDir(e.target.value)} placeholder="data/files" />
              <Button onClick={saveFileSettings}>保存</Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div><Label>按学生组织子目录</Label><p className="text-xs text-gray-400">附件按学生与投稿轮次归档</p></div>
            <Switch checked={organizeByStudent} onCheckedChange={setOrganizeByStudent} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>学位类型</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {degreeTypes.map((dt, idx) => (
            <div key={`${dt}-${idx}`} className="flex items-center justify-between rounded-md border px-3 py-2">
              {editingIdx === idx ? (
                <div className="flex gap-2 flex-1 mr-2">
                  <Input value={editValue} onChange={e => setEditValue(e.target.value)} />
                  <Button size="sm" onClick={() => saveDegreeTypeEdit(idx)}>保存</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingIdx(null)}>取消</Button>
                </div>
              ) : (
                <>
                  <span className="text-sm">{dt}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingIdx(idx); setEditValue(dt); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => removeDegreeType(idx)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                </>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <Input value={newDegreeType} onChange={(e) => setNewDegreeType(e.target.value)} placeholder="输入新学位类型" onKeyDown={(e) => e.key === "Enter" && addDegreeType()} />
            <Button onClick={addDegreeType}><Plus className="h-4 w-4 mr-1" />添加</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>AI任务包偏好</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">生成给外部模型的任务包时默认带上这些材料；每次生成前仍可单独调整。</p>
          {aiOptions.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm">{label}</span>
              <Switch checked={aiDefaults[key]} onCheckedChange={(v) => setAiDefaults((prev) => ({ ...prev, [key]: v }))} />
            </div>
          ))}
          <Button onClick={saveAiDefaults}>保存任务包偏好</Button>
        </CardContent>
      </Card>

    </div>
  );
}
