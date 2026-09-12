"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Save, CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { renderPromptTemplate } from "@/lib/ai-prompt-templates";

type Template = { key?: string; id?: number; name: string; taskType: string; description?: string; body: string };
type WorkItem = { id: string; source: string; action: string; priority: string; target: string; done: string };

function fmt(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString().slice(0, 10);
}

function block(title: string, body: string) {
  const text = body.trim();
  return text ? `## ${title}\n\n${text}` : "";
}

function safeJson<T>(value: any, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "object") return value as T;
  try { return JSON.parse(String(value)) as T; } catch { return fallback; }
}

export function AiTaskWorkbench({
  context, builtinTemplates, customTemplates: initialCustomTemplates, previousRuns,
}: {
  context: any;
  builtinTemplates: Template[];
  customTemplates: Template[];
  previousRuns: any[];
}) {
  const allInitial: Template[] = [
    ...builtinTemplates,
    ...initialCustomTemplates.map((t) => ({ ...t, key: `custom-${t.id}`, description: "我的模板" })),
  ];
  const first = allInitial[0];
  const [templates, setTemplates] = useState<Template[]>(allInitial);
  const [selectedKey, setSelectedKey] = useState(first?.key || "");
  const [templateName, setTemplateName] = useState(first?.name || "");
  const [taskType, setTaskType] = useState(first?.taskType || "reviewer_analysis");
  const [promptBody, setPromptBody] = useState(first?.body || "");
  const [customName, setCustomName] = useState("");
  const [supplementalText, setSupplementalText] = useState("");
  const [resultText, setResultText] = useState("");
  const [runs, setRuns] = useState(previousRuns || []);
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [parsedItems, setParsedItems] = useState<WorkItem[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activeAccepted, setActiveAccepted] = useState(false);
  const defaults = context.aiDefaults || {};
  const [include, setInclude] = useState({
    editorDecision: defaults.includeEditorDecision !== false,
    reviewerComments: defaults.includeReviewerComments !== false,
    revisionHistory: defaults.includeRevisionHistory !== false,
    submissionHistory: defaults.includeSubmissionHistory !== false,
    responsibilityHistory: defaults.includeResponsibilityHistory !== false,
    attachments: defaults.includeAttachments !== false,
  });

  const values = useMemo(() => {
    const sub = context.currentSubmission;
    const rev = context.revision || null;
    const revisionHistory = context.submissionHistory
      .flatMap((s: any) => s.revisions.map((r: any) =>
        `${s.venueName} 第${r.revisionRound}轮：${r.revisionType} / ${r.status}\n审稿摘要：${r.commentsSummary || "-"}\n回复/结果：${r.responseSummary || "-"}`
      )).join("\n\n");
    return {
      paper_title: sub.manuscriptTitle || context.paperTitle,
      paper_short_title: context.paperShortTitle || context.paperTitle,
      journal: sub.venueName,
      target_journal: context.targetJournal,
      manuscript_no: sub.manuscriptNo || "",
      manuscript_title: sub.manuscriptTitle || context.paperTitle,
      revision_round: rev ? String(rev.revisionRound) : "无返修轮次",
      reviewer_comments: [sub.reviewerComments, rev?.commentsSummary].filter(Boolean).join("\n\n"),
      editor_decision: [sub.decision ? `决定：${sub.decision}` : "", sub.editorComments].filter(Boolean).join("\n\n"),
      revision_history: revisionHistory,
    };
  }, [context]);

  const renderedPrompt = useMemo(() => renderPromptTemplate(promptBody, values), [promptBody, values]);

  const packageText = useMemo(() => {
    const sub = context.currentSubmission;
    const rev = context.revision || null;
    const meta = [
      `- 论文题名：${sub.manuscriptTitle || context.paperTitle}`,
      `- 当前期刊/会议：${sub.venueName}`,
      `- 当前目标：${context.targetJournal || "-"}`,
      `- 投稿轮次：第${sub.submissionRound}次`,
      rev ? `- 返修轮次：第${rev.revisionRound}轮` : "",
      `- 稿件编号：${sub.manuscriptNo || "-"}`,
      `- 第一作者：${sub.firstAuthor || "-"}`,
      `- 通讯作者：${sub.correspondingAuthor || "-"}`,
      `- 本轮负责学生：${sub.responsibleStudentName || "未单独记录"}`,
      `- 当前状态：${sub.status}`,
    ].filter(Boolean).join("\n");

    const parts: string[] = [
      `# AI任务包：${templateName || "论文辅助任务"}`,
      `生成时间：${new Date().toLocaleString("zh-CN")}`,
      block("任务提示词", renderedPrompt),
      block("论文与当前投稿", meta),
    ];

    if (include.editorDecision) {
      parts.push(block("编辑决定", [
        sub.decision ? `决定：${sub.decision}` : "",
        sub.decisionAt ? `决定日期：${fmt(sub.decisionAt)}` : "",
        sub.editorComments || "",
      ].filter(Boolean).join("\n\n")));
    }
    if (include.reviewerComments) {
      parts.push(block("本轮审稿意见", [
        sub.reviewerComments || "",
        rev?.commentsSummary ? `返修记录中的审稿摘要：\n${rev.commentsSummary}` : "",
      ].filter(Boolean).join("\n\n")));
    }
    if (include.revisionHistory) {
      const history = context.submissionHistory.flatMap((s: any) =>
        s.revisions.map((r: any) => [
          `### ${s.venueName} · 第${r.revisionRound}轮返修`,
          `状态：${r.status}；类型：${r.revisionType}`,
          `收到：${fmt(r.receivedAt)}；截止：${fmt(r.dueAt)}；提交：${fmt(r.submittedAt)}`,
          r.commentsSummary ? `审稿摘要：\n${r.commentsSummary}` : "",
          r.responseSummary ? `回复/结果：\n${r.responseSummary}` : "",
        ].filter(Boolean).join("\n"))
      ).join("\n\n");
      parts.push(block("返修历史", history));
    }
    if (include.submissionHistory) {
      const history = context.submissionHistory.map((s: any) => [
        `### 第${s.submissionRound}次投稿 · ${s.venueName}`,
        `状态：${s.status}${s.decision ? `；决定：${s.decision}` : ""}`,
        `投稿：${fmt(s.submittedAt)}；决定：${fmt(s.decisionAt)}`,
        `稿件题名：${s.manuscriptTitle || "-"}`,
        `第一作者：${s.firstAuthor || "-"}；通讯作者：${s.correspondingAuthor || "-"}`,
        `本轮负责学生：${s.responsibleStudentName || "未单独记录"}`,
        s.id !== sub.id && s.editorComments ? `历史编辑意见：\n${s.editorComments}` : "",
        s.id !== sub.id && s.reviewerComments ? `历史审稿意见：\n${s.reviewerComments}` : "",
      ].filter(Boolean).join("\n")).join("\n\n");
      parts.push(block("投稿历史（截至当前轮次）", history));
    }
    if (include.responsibilityHistory && context.responsibilityTransfers.length) {
      const transfers = context.responsibilityTransfers.map((t: any) =>
        `- ${t.from} → ${t.to}${t.transferredAt ? `（${fmt(t.transferredAt)}）` : ""}${t.notes ? `：${t.notes}` : ""}`
      ).join("\n");
      parts.push(block("责任交接", transfers));
    }
    if (include.attachments && context.attachments.length) {
      const manifest = context.attachments.map((a: any) =>
        `- [${a.fileExists ? "实体可用" : "仅记录"}] ${a.fileName} · ${a.description || a.relatedType} · 材料来源：${a.sourceStudentName || "未记录"}`
      ).join("\n");
      parts.push(block("附件清单", manifest));
    }
    if (supplementalText.trim()) parts.push(block("补充材料文本", supplementalText));
    return parts.filter(Boolean).join("\n\n").trim() + "\n";
  }, [context, include, renderedPrompt, supplementalText, templateName]);

  function selectTemplate(key: string) {
    const t = templates.find((x) => (x.key || `custom-${x.id}`) === key);
    if (!t) return;
    setSelectedKey(key);
    setTemplateName(t.name);
    setTaskType(t.taskType);
    setPromptBody(t.body);
  }

  function resetTemplate() {
    const t = templates.find((x) => (x.key || `custom-${x.id}`) === selectedKey);
    if (!t) return;
    setPromptBody(t.body);
    toast.success("已恢复当前模板");
  }

  async function copyPackage() {
    await navigator.clipboard.writeText(packageText);
    toast.success("完整任务包已复制");
  }

  function downloadPackage() {
    const blob = new Blob([packageText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const suffix = context.revision ? `R${context.revision.revisionRound}` : `S${context.currentSubmission.submissionRound}`;
    a.download = `${context.currentSubmission.venueName}_${suffix}_${templateName || "AI任务包"}.md`.replace(/[\\/:*?"<>|]/g, "_");
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveTemplate() {
    const name = customName.trim() || `${templateName}（我的版本）`;
    const res = await fetch("/api/ai/templates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, taskType, body: promptBody }),
    });
    if (!res.ok) return toast.error("模板保存失败");
    const row = await res.json();
    const t = { ...row, key: `custom-${row.id}`, description: "我的模板" };
    setTemplates((prev) => [t, ...prev]);
    setSelectedKey(t.key);
    setTemplateName(t.name);
    setCustomName("");
    toast.success("已保存到我的模板");
  }

  async function deleteTemplate() {
    if (!selectedKey.startsWith("custom-")) return;
    const id = Number(selectedKey.replace("custom-", ""));
    const res = await fetch(`/api/ai/templates?id=${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("模板删除失败");
    const remaining = templates.filter((t) => (t.key || `custom-${t.id}`) !== selectedKey);
    setTemplates(remaining);
    const next = remaining[0];
    if (next) {
      const key = next.key || `custom-${next.id}`;
      setSelectedKey(key); setTemplateName(next.name); setTaskType(next.taskType); setPromptBody(next.body);
    }
    toast.success("个人模板已删除");
  }

  function applyRun(row: any) {
    setActiveRunId(row.id);
    setResultText(row.rawResult || row.resultText || "");
    const parsed = safeJson<any>(row.parsedJson, { items: [], warnings: [] });
    const accepted = safeJson<any>(row.acceptedJson, { items: [] });
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    setParsedItems(items);
    setParseWarnings(Array.isArray(parsed.warnings) ? parsed.warnings : []);
    setSelectedItemIds(Array.isArray(accepted.items) ? accepted.items.map((x: any) => x.id) : []);
    setActiveAccepted(Boolean(row.acceptedAt || row.resultStatus === "confirmed"));
  }

  async function saveAndParse() {
    const res = await fetch("/api/ai/runs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: context.submissionId,
        revisionId: context.revisionId || null,
        taskType, templateKey: selectedKey, templateName,
        promptText: renderedPrompt, packageText, supplementalText,
        rawResult: resultText,
        materialJson: {
          include,
          paperId: context.paperId,
          submissionId: context.submissionId,
          revisionId: context.revisionId || null,
        },
      }),
    });
    if (!res.ok) return toast.error("结果保存失败");
    const row = await res.json();
    setRuns((prev: any[]) => [row, ...prev]);
    applyRun(row);
    const parsed = safeJson<any>(row.parsedJson, { items: [] });
    toast.success(parsed.items?.length ? `原始结果已保存，解析到 ${parsed.items.length} 个工作项` : "原始结果已保存；未检测到可采用工作项");
  }

  function editItem(id: string, key: keyof WorkItem, value: string) {
    if (key === "source") return;
    setParsedItems((prev) => prev.map((item) => item.id === id ? { ...item, [key]: value } : item));
  }

  function toggleItem(id: string, checked: boolean) {
    setSelectedItemIds((prev) => checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id));
  }

  async function adoptSelected() {
    if (!activeRunId) return toast.error("请先保存并解析当前结果");
    if (!selectedItemIds.length) return toast.error("请至少勾选一个工作项");
    const items = parsedItems.filter((item) => selectedItemIds.includes(item.id));
    const res = await fetch("/api/ai/runs", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: activeRunId, action: "adopt", rawResult: resultText, items }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error || "采用失败");
    setRuns((prev: any[]) => prev.map((r) => r.id === data.id ? data : r));
    applyRun(data);
    toast.success(`已人工采用 ${items.length} 个工作项；原始结果和 SOURCE 均保留`);
  }

  const toggles: Array<[keyof typeof include, string]> = [
    ["editorDecision", "编辑决定"], ["reviewerComments", "审稿意见"],
    ["revisionHistory", "返修历史"], ["submissionHistory", "投稿历史"],
    ["responsibilityHistory", "责任交接"], ["attachments", "附件清单"],
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-4 items-start">
      <div className="space-y-4">
        <section className="paper-detail-card">
          <div className="paper-detail-card-head"><span>提示词</span><span className="paper-muted-note">可直接修改</span></div>
          <div className="paper-detail-card-body space-y-3">
            <div>
              <label className="text-[11px] text-slate-500">模板</label>
              <select className="mt-1 w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={selectedKey} onChange={(e) => selectTemplate(e.target.value)}>
                {templates.map((t) => {
                  const key = t.key || `custom-${t.id}`;
                  return <option key={key} value={key}>{t.name}{t.description === "我的模板" ? " · 我的" : ""}</option>;
                })}
              </select>
            </div>
            <Textarea value={promptBody} onChange={(e) => setPromptBody(e.target.value)} rows={18} className="font-mono text-[12px]" />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={resetTemplate}><RotateCcw className="h-4 w-4 mr-1" />恢复当前模板</Button>
              {selectedKey.startsWith("custom-") && <Button variant="outline" onClick={deleteTemplate}><Trash2 className="h-4 w-4 mr-1" />删除我的模板</Button>}
            </div>
            <div className="flex gap-2">
              <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="个人模板名称（可选）" />
              <Button variant="outline" onClick={saveTemplate}><Save className="h-4 w-4 mr-1" />保存为我的模板</Button>
            </div>
          </div>
        </section>

        <section className="paper-detail-card">
          <div className="paper-detail-card-head"><span>带入资料</span><span className="paper-muted-note">按本次任务选择</span></div>
          <div className="paper-detail-card-body space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {toggles.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-[12px] cursor-pointer">
                  <input type="checkbox" checked={include[key]} onChange={(e) => setInclude((prev) => ({ ...prev, [key]: e.target.checked }))} />
                  {label}
                </label>
              ))}
            </div>
            <div>
              <label className="text-[11px] text-slate-500">补充材料文本</label>
              <Textarea className="mt-1" value={supplementalText} onChange={(e) => setSupplementalText(e.target.value)} rows={8} placeholder="需要模型阅读、但还没进入平台的正文可以直接贴在这里。" />
            </div>
          </div>
        </section>

        <section className="paper-detail-card">
          <div className="paper-detail-card-head"><span>模型原始结果</span><span className="paper-muted-note">原文永久保留；本地解析不调用模型</span></div>
          <div className="paper-detail-card-body space-y-3">
            <Textarea
              value={resultText}
              onChange={(e) => { setResultText(e.target.value); setActiveRunId(null); setParsedItems([]); setSelectedItemIds([]); setParseWarnings([]); setActiveAccepted(false); }}
              rows={14}
              placeholder="粘贴模型输出。带 [WORK_ITEM] 的结果会在本地解析；未按协议输出时仍保存原文，不自动猜测。"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={saveAndParse}><Save className="h-4 w-4 mr-1" />保存并解析</Button>
            </div>
          </div>
        </section>

        {(parsedItems.length > 0 || parseWarnings.length > 0) && (
          <section className="paper-detail-card">
            <div className="paper-detail-card-head">
              <span>可采用工作项</span>
              <span className="paper-muted-note">默认 0 项采用；SOURCE 只读</span>
            </div>
            <div className="paper-detail-card-body space-y-3">
              {parseWarnings.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 space-y-1">
                  {parseWarnings.map((w, i) => <div key={`${w}-${i}`}>• {w}</div>)}
                </div>
              )}
              {parsedItems.map((item) => (
                <div key={item.id} className="rounded-md border border-slate-200 p-3 space-y-2">
                  <label className="flex items-start gap-2 text-[12px] font-medium text-slate-700">
                    <input type="checkbox" className="mt-0.5" disabled={activeAccepted} checked={selectedItemIds.includes(item.id)} onChange={(e) => toggleItem(item.id, e.target.checked)} />
                    <span>采用此项 <span className="font-mono text-[10px] text-slate-400">{item.id}</span></span>
                  </label>
                  <div>
                    <label className="text-[10px] text-slate-500">SOURCE · 来源锁定</label>
                    <Textarea readOnly value={item.source} rows={2} className="mt-1 bg-slate-50 text-[11px]" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">ACTION</label>
                    <Textarea disabled={activeAccepted} value={item.action} onChange={(e) => editItem(item.id, "action", e.target.value)} rows={3} className="mt-1 text-[11px]" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div><label className="text-[10px] text-slate-500">PRIORITY</label><Input disabled={activeAccepted} value={item.priority} onChange={(e) => editItem(item.id, "priority", e.target.value)} className="mt-1 text-[11px]" /></div>
                    <div><label className="text-[10px] text-slate-500">TARGET</label><Input disabled={activeAccepted} value={item.target} onChange={(e) => editItem(item.id, "target", e.target.value)} className="mt-1 text-[11px]" /></div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">完成判据</label>
                    <Textarea disabled={activeAccepted} value={item.done} onChange={(e) => editItem(item.id, "done", e.target.value)} rows={2} className="mt-1 text-[11px]" />
                  </div>
                </div>
              ))}
              {parsedItems.length > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500">已选择 {selectedItemIds.length} / {parsedItems.length}</span>
                  <Button disabled={activeAccepted || selectedItemIds.length === 0} onClick={adoptSelected}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />{activeAccepted ? "已采用" : "采用所选工作项"}
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="space-y-4 xl:sticky xl:top-4">
        <section className="paper-detail-card">
          <div className="paper-detail-card-head">
            <span>完整任务包</span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={copyPackage}><Copy className="h-3.5 w-3.5 mr-1" />复制</Button>
              <Button size="sm" variant="outline" onClick={downloadPackage}><Download className="h-3.5 w-3.5 mr-1" />Markdown</Button>
            </div>
          </div>
          <div className="paper-detail-card-body">
            <Textarea readOnly value={packageText} rows={34} className="font-mono text-[11px] leading-5 bg-slate-50" />
          </div>
        </section>

        <section className="paper-detail-card">
          <div className="paper-detail-card-head"><span>最近结果</span><span className="paper-muted-note">{runs.length} 条</span></div>
          <div className="paper-detail-card-body space-y-2">
            {runs.length === 0 ? <p className="text-[11px] text-slate-400">还没有保存过结果</p> : runs.slice(0, 6).map((r: any) => (
              <button key={r.id} type="button" onClick={() => applyRun(r)} className="block w-full text-left rounded-md border border-slate-200 px-3 py-2 text-[11px] hover:bg-slate-50">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-700">{r.templateName || r.taskType}</span>
                  <span className={r.resultStatus === "confirmed" ? "text-green-700" : "text-slate-400"}>{r.resultStatus === "confirmed" ? "已人工采用" : "未采用"}</span>
                </div>
                <div className="mt-1 text-slate-400">{fmt(r.createdAt)}</div>
                {(r.rawResult || r.resultText) && <p className="mt-1 text-slate-600 line-clamp-3 whitespace-pre-wrap">{r.rawResult || r.resultText}</p>}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
