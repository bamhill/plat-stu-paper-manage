import { Badge } from "@/components/ui/badge";

const STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  graduated: "bg-blue-100 text-blue-800",
  delayed: "bg-yellow-100 text-yellow-800",
  suspended: "bg-red-100 text-red-800",
  writing: "bg-gray-100 text-gray-700",
  ready_to_submit: "bg-purple-100 text-purple-800",
  submitted: "bg-blue-100 text-blue-800",
  minor_revision: "bg-yellow-100 text-yellow-800",
  major_revision: "bg-orange-100 text-orange-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  published: "bg-teal-100 text-teal-800",
  pending: "bg-gray-100 text-gray-700",
  under_review: "bg-blue-100 text-blue-800",
  decisioned: "bg-purple-100 text-purple-800",
  revising: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  reviewed: "bg-purple-100 text-purple-800",
  revision: "bg-yellow-100 text-yellow-800",
  defended: "bg-green-100 text-green-800",
  proposal: "bg-gray-100 text-gray-700",
  midterm: "bg-blue-100 text-blue-800",
  draft: "bg-purple-100 text-purple-800",
  review: "bg-yellow-100 text-yellow-800",
  defense: "bg-green-100 text-green-800",
  archived: "bg-gray-200 text-gray-600",
  pass: "bg-green-100 text-green-800",
  minor: "bg-yellow-100 text-yellow-800",
  major: "bg-orange-100 text-orange-800",
  resubmit: "bg-red-100 text-red-800",
  accept: "bg-green-100 text-green-800",
  reject: "bg-red-100 text-red-800",
  fail: "bg-red-100 text-red-800",
  internal: "bg-blue-100 text-blue-800",
  external: "bg-purple-100 text-purple-800",
  anonymous: "bg-gray-100 text-gray-700",
};

const LABELS: Record<string, string> = {
  active: "在读", graduated: "已毕业", delayed: "延期", suspended: "休学",
  writing: "撰写中", ready_to_submit: "待投稿", submitted: "已投稿",
  minor_revision: "小修", major_revision: "大修", accepted: "已接收",
  rejected: "已拒稿", published: "已发表",
  pending: "待处理", under_review: "审稿中", decisioned: "已返回",
  revising: "返修中", completed: "已完成",
  in_progress: "进行中", reviewed: "已审阅", defended: "已答辩",
  proposal: "开题", midterm: "中期", draft: "初稿", review: "审稿",
  revision: "修改中", defense: "答辩", archived: "已归档",
  pass: "通过", minor: "小修", major: "大修", resubmit: "重投",
  accept: "接收", reject: "拒稿", fail: "不通过",
  internal: "校内", external: "校外", anonymous: "匿名",
};

export function StatusBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-gray-400">-</span>;
  const style = STYLES[value] ?? "bg-gray-100 text-gray-700";
  const label = LABELS[value] ?? value;
  return <Badge className={style} variant="secondary">{label}</Badge>;
}
