"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";

export function SettingsClient() {
  const [fileRootDir, setFileRootDir] = useState("data/files");
  const [organizeByStudent, setOrganizeByStudent] = useState(true);
  const [degreeTypes, setDegreeTypes] = useState<string[]>([]);
  const [newDegreeType, setNewDegreeType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.fileRootDir) setFileRootDir(data.fileRootDir);
        if (data.organizeByStudent !== undefined)
          setOrganizeByStudent(data.organizeByStudent);
        if (data.degreeTypes) setDegreeTypes(data.degreeTypes);
        setLoading(false);
      });
  }, []);

  async function saveFileSettings() {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileRootDir, organizeByStudent }),
    });
    if (res.ok) toast.success("文件设置已保存");
    else toast.error("保存失败");
  }

  async function addDegreeType() {
    if (!newDegreeType.trim()) return;
    const updated = [...degreeTypes, newDegreeType.trim()];
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ degreeTypes: updated }),
    });
    if (res.ok) {
      setDegreeTypes(updated);
      setNewDegreeType("");
      toast.success("学位类型已添加");
    }
  }

  async function removeDegreeType(idx: number) {
    const updated = degreeTypes.filter((_, i) => i !== idx);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ degreeTypes: updated }),
    });
    if (res.ok) {
      setDegreeTypes(updated);
      toast.success("学位类型已删除");
    }
  }

  if (loading) return <div className="text-gray-400">加载中...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* File Settings */}
      <Card>
        <CardHeader>
          <CardTitle>文件存储设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>附件存储目录</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={fileRootDir}
                onChange={(e) => setFileRootDir(e.target.value)}
                placeholder="data/files"
              />
              <Button onClick={saveFileSettings}>保存</Button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              相对于项目根目录的路径，默认为 data/files
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>按学生组织子目录</Label>
              <p className="text-xs text-gray-400">
                启用后，附件将按【学生姓名_学号/类型】创建子目录
              </p>
            </div>
            <Switch
              checked={organizeByStudent}
              onCheckedChange={(v) => {
                setOrganizeByStudent(v);
              }}
            />
          </div>
          <Button onClick={saveFileSettings} variant="outline">
            保存文件设置
          </Button>
        </CardContent>
      </Card>

      {/* Degree Types */}
      <Card>
        <CardHeader>
          <CardTitle>学位类型管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            管理学生可选的学位类型。修改后将影响学生表单中的学位类型下拉选项。
          </p>
          <div className="space-y-2">
            {degreeTypes.map((dt, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span className="text-sm">{dt}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDegreeType(idx)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newDegreeType}
              onChange={(e) => setNewDegreeType(e.target.value)}
              placeholder="输入新学位类型，如：工程博士"
              onKeyDown={(e) => e.key === "Enter" && addDegreeType()}
            />
            <Button onClick={addDegreeType}>
              <Plus className="h-4 w-4 mr-1" />
              添加
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
