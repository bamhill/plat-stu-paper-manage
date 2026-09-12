export type BuiltinPromptTemplate = {
  key: string;
  name: string;
  taskType: string;
  description: string;
  body: string;
};

const CORE_PROMPT_TEMPLATES: BuiltinPromptTemplate[] = [
  {
    key: "reviewer_structure",
    name: "审稿意见结构化整理",
    taskType: "reviewer_analysis",
    description: "把长审稿意见拆成可执行的独立问题。",
    body: `你是一名具有高水平学术论文审稿和返修经验的研究者。

以下是论文当前投稿信息与本轮审稿意见。
论文：{{paper_title}}
期刊：{{journal}}
稿件编号：{{manuscript_no}}
当前轮次：{{revision_round}}

审稿意见：
{{reviewer_comments}}

请先对审稿意见进行结构化分析，不要直接替作者写回复信。
对每一条独立意见给出：
- Reviewer及Comment编号
- 审稿人明确提出的问题
- 审稿意见背后的核心关切
- 问题类型：研究问题 / 理论 / 文献 / 方法 / 数据 / 实验 / 结果 / 讨论 / 写作 / 格式 / 其他
- 修改优先级：高 / 中 / 低
- 建议修改位置
- 建议采取的处理方式
- 是否需要新增分析、实验或数据
- 是否存在理解不清、要求冲突或需要谨慎回应的地方

不要把多条意见强行合并，保留审稿人的原始逻辑。`,
  },
  {
    key: "revision_plan",
    name: "返修任务规划",
    taskType: "revision_plan",
    description: "把审稿意见转换为有先后关系的返修任务。",
    body: `根据以下审稿意见与当前材料，为本轮论文返修制定具体执行计划。

论文：{{paper_title}}
期刊：{{journal}}
当前轮次：{{revision_round}}

审稿意见：
{{reviewer_comments}}

请输出一份可直接用于返修管理的任务表，每项包括：
- 对应 Reviewer / Comment
- 需要完成的修改
- 修改涉及章节
- 是否涉及数据、代码、实验或图表
- 前置依赖
- 建议执行顺序
- 完成判据
- 回复信中必须说明的内容

请特别识别：
1. 多位审稿人重复提出的问题；
2. 一个修改可以同时回应多条意见的情况；
3. 可能引起连锁修改的核心问题；
4. 仅修改文字无法真正解决的问题。

不要为了让任务显得完整而制造不必要的工作量。`,
  },
  {
    key: "response_draft",
    name: "逐条回复信草稿",
    taskType: "response_draft",
    description: "基于真实修改记录起草 point-by-point response。",
    body: `请根据以下审稿意见和作者已经完成的修改，起草逐条回复。

论文：{{paper_title}}
期刊：{{journal}}
当前轮次：{{revision_round}}

审稿意见：
{{reviewer_comments}}

已完成的修改与返修记录：
{{revision_history}}

要求：
- 准确回应审稿人的真实关切；
- 明确说明作者具体做了什么修改；
- 能确定时指出修改所在章节、页码、表格或图；
- 如果没有完全采纳意见，应给出专业、充分且克制的理由；
- 不使用夸张感谢、过度谦卑或防御性语言；
- 不虚构没有完成的数据、实验或修改。

按 Reviewer / Comment 输出：
Comment:
Response:
Changes in manuscript:`,
  },
  {
    key: "revision_audit",
    name: "返修完成度检查",
    taskType: "revision_audit",
    description: "重新投稿前检查有没有漏答、空答和回复—稿件不一致。",
    body: `你现在作为严格的返修质量检查者。

论文：{{paper_title}}
期刊：{{journal}}
当前轮次：{{revision_round}}

审稿意见：
{{reviewer_comments}}

返修记录：
{{revision_history}}

请逐条检查：
- 是否真正回答审稿人的问题；
- 回复中声称完成的修改是否有对应修改记录；
- 是否存在只解释、不修改的问题；
- 是否遗漏意见中的子问题；
- 不同回复之间是否存在矛盾；
- 是否有论文修改但回复信没有说明；
- 是否有回复信承诺但修改记录中没有体现；
- 是否存在可能导致二审再次追问的薄弱回应。

最后按“已充分解决 / 仍需补强 / 尚未解决”分类，并给出具体下一步。`,
  },
  {
    key: "transfer_analysis",
    name: "拒稿后的改投分析",
    taskType: "transfer_analysis",
    description: "区分论文自身问题与上一期刊匹配问题，形成下一投最小必要修改。",
    body: `请基于上一轮投稿结果，为论文下一次改投做分析。

论文：{{paper_title}}
上一投稿期刊：{{journal}}
编辑决定：
{{editor_decision}}
审稿意见：
{{reviewer_comments}}
当前目标期刊：{{target_journal}}

请分析：
1. 上一轮拒稿的主要原因；
2. 哪些问题属于论文自身问题，换刊也必须解决；
3. 哪些问题主要来自上一期刊的定位或审稿偏好；
4. 转投目标期刊前必须完成的修改；
5. 题名、摘要、Introduction、贡献表达是否需要调整；
6. 哪些原审稿意见可以不再继续扩展；
7. 给出“改投前最小必要修改清单”。

不要为了迎合目标期刊而改变已有证据支持的核心研究结论。`,
  },
  {
    key: "title_abstract",
    name: "英文题名与摘要优化",
    taskType: "title_abstract",
    description: "按目标期刊检查题名和摘要，不堆概念。",
    body: `当前准备投稿：{{target_journal}}
中文简称：{{paper_short_title}}
当前英文题名：{{manuscript_title}}

请结合任务包中的论文信息检查英文题名和摘要/稿件摘要材料。
重点检查：
- 题名是否准确反映研究对象、问题和方法；
- 是否存在过度宽泛、概念堆砌或 AI 式标题；
- 摘要是否清楚交代问题、方法、数据、主要结果和贡献；
- 是否有不能被本文证据支持的表述；
- 是否需要针对目标期刊改变强调重点。

先给问题诊断，再给 2–3 个题名候选和一版修改后的摘要。不要为了显得新颖而人为增加术语。`,
  },
];


const STRUCTURED_OUTPUT_PROTOCOL = `

输出协议（用于本地解析与人工选择采用）：
对每个可执行工作项使用以下固定格式。SOURCE 必须对应任务包中已有的审稿、编辑或历史依据；材料不足时直接说明，不得补造来源事实。

[WORK_ITEM]
SOURCE: <原始依据或明确编号>
ACTION: <建议执行动作>
PRIORITY: <高/中/低>
TARGET: <章节/表图/回复信/投稿检查位置>
DONE: <可核验的完成判据>
[/WORK_ITEM]`;

const STRUCTURED_TASK_TYPES = new Set(["reviewer_analysis", "revision_plan", "revision_audit", "transfer_analysis"]);

export const BUILTIN_PROMPT_TEMPLATES: BuiltinPromptTemplate[] = CORE_PROMPT_TEMPLATES.map((template) =>
  STRUCTURED_TASK_TYPES.has(template.taskType)
    ? { ...template, body: `${template.body}${STRUCTURED_OUTPUT_PROTOCOL}` }
    : template
);

export function renderPromptTemplate(body: string, values: Record<string, string | null | undefined>) {
  return body.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_m, key) => String(values[key] ?? ""));
}
