import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentTeacher } from "@/lib/auth";

export async function GET() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["姓名", "学号", "学位类型", "入学年份", "毕业年份", "研究方向", "导师", "副导师", "状态", "备注"],
    ["张三", "2024001", "工学硕士", 2024, "", "工程管理", "王教授", "", "active", ""],
  ]), "学生");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["学号", "标题", "类型(journal/conference)", "方向", "状态", "目标期刊", "版本标签", "我的思考", "备注"],
    ["2024001", "示例论文简称", "journal", "工程管理", "writing", "Applied Intelligence", "V1_202609", "", ""],
  ]), "小论文");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["学号", "论文标题", "期刊/会议名", "轮次", "稿件编号", "本轮英文题名", "本轮第一作者", "本轮通讯作者", "投稿日期", "进入外审日期", "决定日期", "决定", "状态", "审稿意见", "编辑意见", "备注"],
    ["2024001", "示例论文简称", "Applied Intelligence", 1, "MS-2026-001", "Example manuscript title", "Zhang San", "Wang Professor", "2026-09-01", "", "", "", "pending", "", "", ""],
  ]), "投稿记录");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ["学号", "论文标题", "期刊/会议名", "返修轮次", "类型(minor/major/resubmit)", "收到日期", "截止日期", "提交日期", "状态", "审稿意见摘要", "回复摘要", "备注"],
    ["2024001", "示例论文简称", "Applied Intelligence", 1, "minor", "2026-10-01", "2026-11-01", "", "pending", "", "", ""],
  ]), "返修记录");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=import_template.xlsx",
    },
  });
}
