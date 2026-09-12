export function paperDisplayTitle(title: string) {
  const t = (title || "").trim();
  if (/Expert-in-the-Loop/i.test(t) && /Engineering Change Proposal/i.test(t)) return "工程变更方案智能体";
  if (/Traversal-Based Discovery of Cross-Hierarchy Engineering Change Propagation Paths/i.test(t)) return "工程变更路径识别";
  if (/Explainable Risk Assessment of Engineering Change Propagation Paths/i.test(t)) return "工程变更路径优化";
  if (/大语言模型低成本安全约束对齐方法/.test(t)) return "安全约束保持";
  if (/本体与知识蒸馏协同驱动/.test(t)) return "焊接知识蒸馏";
  if (/Generative Agent-based Experience Knowledge Insight/i.test(t)) return "智能体交互知识洞察";
  return t;
}
