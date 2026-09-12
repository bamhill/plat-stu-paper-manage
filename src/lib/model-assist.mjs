import crypto from "node:crypto";

export const MODEL_ASSIST_PARSER_VERSION = "r19-local-v1";

const FIELD_ALIASES = new Map([
  ["SOURCE", "source"], ["来源", "source"],
  ["ACTION", "action"], ["动作", "action"], ["处理", "action"],
  ["PRIORITY", "priority"], ["优先级", "priority"],
  ["TARGET", "target"], ["目标", "target"], ["修改位置", "target"],
  ["DONE", "done"], ["DONE_CRITERIA", "done"], ["COMPLETION", "done"],
  ["完成判据", "done"], ["完成标准", "done"],
]);

function stableId(item, index) {
  const basis = `${index}\n${item.source}\n${item.action}\n${item.target}`;
  return `wi_${crypto.createHash("sha256").update(basis, "utf8").digest("hex").slice(0, 12)}`;
}

function normalizeLine(line) {
  return String(line || "").replace(/^[-*]\s*/, "").trim();
}

export function parseModelAssistResult(rawInput) {
  const raw = String(rawInput || "").replace(/\r\n?/g, "\n");
  const warnings = [];
  const items = [];
  const blockRe = /\[WORK_ITEM\]([\s\S]*?)(?:\[\/WORK_ITEM\]|(?=\[WORK_ITEM\])|$)/gi;
  let match;
  let ordinal = 0;

  while ((match = blockRe.exec(raw)) !== null) {
    ordinal += 1;
    const block = match[1].trim();
    const item = { source: "", action: "", priority: "", target: "", done: "" };
    let activeKey = null;

    for (const originalLine of block.split("\n")) {
      const line = normalizeLine(originalLine);
      if (!line) continue;
      const m = line.match(/^([A-Za-z_]+|[\u4e00-\u9fff]{2,8})\s*[：:]\s*(.*)$/);
      if (m) {
        const alias = m[1].trim().toUpperCase();
        const key = FIELD_ALIASES.get(alias) || FIELD_ALIASES.get(m[1].trim());
        if (key) {
          activeKey = key;
          item[key] = m[2].trim();
          continue;
        }
      }
      if (activeKey) item[activeKey] = `${item[activeKey]}\n${line}`.trim();
      else warnings.push(`WORK_ITEM ${ordinal} 中存在未识别文本：${line.slice(0, 80)}`);
    }

    if (!item.source) warnings.push(`WORK_ITEM ${ordinal} 缺少 SOURCE`);
    if (!item.action) warnings.push(`WORK_ITEM ${ordinal} 缺少 ACTION`);
    if (!item.done) warnings.push(`WORK_ITEM ${ordinal} 缺少完成判据`);
    items.push({ id: stableId(item, ordinal), ...item });
  }

  if (!items.length && raw.trim()) {
    warnings.push("未检测到 [WORK_ITEM] 结构；原始结果已保留，但不会自动生成可采用工作项。");
  }
  if (!raw.trim()) warnings.push("模型结果为空。");

  return { parserVersion: MODEL_ASSIST_PARSER_VERSION, items, warnings };
}

export function validateAcceptedItems(parsed, proposedItems) {
  const sourceById = new Map((parsed?.items || []).map((x) => [x.id, x.source]));
  const accepted = [];
  const warnings = [];
  for (const input of Array.isArray(proposedItems) ? proposedItems : []) {
    const id = String(input?.id || "");
    if (!sourceById.has(id)) {
      warnings.push(`忽略未知工作项 ${id || "(无ID)"}`);
      continue;
    }
    const canonicalSource = sourceById.get(id) || "";
    if (String(input?.source || "") !== canonicalSource) {
      throw new Error(`SOURCE_PROTECTED:${id}`);
    }
    accepted.push({
      id,
      source: canonicalSource,
      action: String(input?.action || "").trim(),
      priority: String(input?.priority || "").trim(),
      target: String(input?.target || "").trim(),
      done: String(input?.done || "").trim(),
    });
  }
  return { accepted, warnings };
}

export function structuredOutputProtocol() {
  return `\n\n输出协议（用于本地解析与人工选择采用）：\n对每个可执行工作项使用以下固定格式；不要省略 SOURCE，SOURCE 必须引用本任务包中已有的审稿/编辑/历史依据，不得自行改写来源事实。\n\n[WORK_ITEM]\nSOURCE: <原始依据或其明确编号>\nACTION: <建议执行动作>\nPRIORITY: <高/中/低>\nTARGET: <章节/表图/回复信/投稿检查位置>\nDONE: <可核验的完成判据>\n[/WORK_ITEM]\n\n若材料不足以形成工作项，直接说明不足，不要虚构 SOURCE。`;
}
