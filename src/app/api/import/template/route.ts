import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const wb = XLSX.utils.book_new();

  // Students
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["姓名", "学号", "学位类型", "入学年份", "毕业年份", "研究方向", "导师", "副导师", "状态", "备注"],
    ["张三", "2024001", "工学硕士", 2024, "", "自然语言处理", "王教授", "", "active", ""],
  ]), "学生");

  // Papers
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["学号", "标题", "类型(journal/conference)", "方向", "第一作者", "通讯作者", "状态", "目标期刊", "版本标签", "我的思考", "备注"],
    ["2024001", "示例论文标题", "journal", "NLP", "张三", "王教授", "writing", "ACL 2026", "V1_202601", "", ""],
  ]), "小论文");

  // Submissions
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["学号", "论文标题", "期刊/会议名", "轮次", "稿件编号", "投稿日期", "决定日期", "决定", "状态", "审稿意见", "编辑意见", "备注"],
    ["2024001", "示例论文标题", "ACL 2026", 1, "MS-2026-001", "2026-03-01", "", "under_review", "under_review", "", "", ""],
  ]), "投稿记录");

  // Revisions
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["学号", "论文标题", "期刊/会议名", "返修轮次", "类型(minor/major/resubmit)", "收到日期", "截止日期", "提交日期", "状态", "审稿意见摘要", "回复摘要", "备注"],
    ["2024001", "示例论文标题", "ACL 2026", 1, "minor", "2026-04-15", "2026-06-15", "", "pending", "三点修改意见", "", ""],
  ]), "返修记录");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=import_template.xlsx",
    },
  });
}
