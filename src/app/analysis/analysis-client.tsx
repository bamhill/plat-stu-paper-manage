"use client";

import { useState, useMemo } from "react";
import { NativeSelect } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ChevronDown, ChevronRight, BarChart3 } from "lucide-react";

const CATEGORIES = [
  { key: "实验不足", keywords: ["实验", "对比", "baseline", "数据", "消融", "ablation", "样本"], color: "bg-red-50 border-red-200" },
  { key: "写作问题", keywords: ["写作", "语法", "表达", "语言", "typo", "拼写", "格式"], color: "bg-yellow-50 border-yellow-200" },
  { key: "创新不足", keywords: ["创新", "novelty", "贡献", "contribution", "新意", "增量"], color: "bg-orange-50 border-orange-200" },
  { key: "文献不足", keywords: ["文献", "综述", "related work", "引用", "reference", "相关工作"], color: "bg-blue-50 border-blue-200" },
  { key: "图表质量", keywords: ["图表", "figure", "table", "图示", "可视化", "清晰度"], color: "bg-purple-50 border-purple-200" },
  { key: "方法缺陷", keywords: ["方法", "method", "框架", "模型", "假设", "局限", "不充分"], color: "bg-pink-50 border-pink-200" },
];

interface RevisionItem {
  id: number;
  revisionRound: number;
  revisionType: string;
  receivedAt: string | null;
  dueAt: string | null;
  submittedAt: string | null;
  commentsSummary: string | null;
  responseSummary: string | null;
  status: string;
  notes: string | null;
  submission: {
    venueName: string;
    submittedAt: string | null;
    decision: string | null;
    reviewerComments: string | null;
    paper: {
      id: number;
      title: string;
      student: { id: number; name: string } | null;
    } | null;
  } | null;
}

interface StudentItem {
  id: number;
  name: string;
}

interface AnalysisClientProps {
  revisions: RevisionItem[];
  students: StudentItem[];
  venues: string[];
}

interface AnalysisResult {
  category: string;
  color: string;
  count: number;
  excerpts: { text: string; studentName: string; paperTitle: string; venue: string }[];
}

function analyzeReviews(revisions: RevisionItem[]): AnalysisResult[] {
  const results = CATEGORIES.map((cat) => ({
    category: cat.key,
    color: cat.color,
    count: 0,
    excerpts: [] as { text: string; studentName: string; paperTitle: string; venue: string }[],
  }));

  revisions.forEach((rev) => {
    const allComments = [rev.commentsSummary, rev.submission?.reviewerComments].filter(Boolean).join(" ");
    const text = allComments.toLowerCase();
    CATEGORIES.forEach((cat, idx) => {
      const matched = cat.keywords.some((kw) => text.includes(kw.toLowerCase()));
      if (matched) {
        results[idx].count++;
        results[idx].excerpts.push({
          text: [rev.commentsSummary, rev.submission?.reviewerComments].filter(Boolean).join(" | ") || "(无文本)",
          studentName: rev.submission?.paper?.student?.name || "",
          paperTitle: rev.submission?.paper?.title || "",
          venue: rev.submission?.venueName || "",
        });
      }
    });
  });

  return results.filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
}

export function AnalysisClient({ revisions, students, venues }: AnalysisClientProps) {
  const [search, setSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState("all");
  const [venueFilter, setVenueFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[] | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filteredRevisions = useMemo(() => {
    return revisions.filter((rev) => {
      if (studentFilter !== "all") {
        const studentName = rev.submission?.paper?.student?.name || "";
        if (studentName !== studentFilter) return false;
      }
      if (venueFilter !== "all" && rev.submission?.venueName !== venueFilter) return false;
      if (typeFilter !== "all" && rev.revisionType !== typeFilter) return false;
      if (dateFrom && rev.receivedAt) {
        const revDate = new Date(rev.receivedAt);
        const from = new Date(dateFrom);
        if (revDate < from) return false;
      }
      if (dateTo && rev.receivedAt) {
        const revDate = new Date(rev.receivedAt);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (revDate > to) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const comments = [rev.commentsSummary, rev.submission?.reviewerComments].filter(Boolean).join(" ").toLowerCase();
        const title = (rev.submission?.paper?.title || "").toLowerCase();
        const studentName = (rev.submission?.paper?.student?.name || "").toLowerCase();
        if (!comments.includes(q) && !title.includes(q) && !studentName.includes(q)) return false;
      }
      return true;
    });
  }, [revisions, studentFilter, venueFilter, typeFilter, dateFrom, dateTo, search]);

  const statsTotal = revisions.length;
  const statsByType = useMemo(() => ({
    minor: revisions.filter(r => r.revisionType === "minor").length,
    major: revisions.filter(r => r.revisionType === "major").length,
    resubmit: revisions.filter(r => r.revisionType === "resubmit").length,
  }), [revisions]);
  const statsByJournal = useMemo(() => {
    const map = new Map<string, { count: number; totalRounds: number }>();
    revisions.forEach(r => {
      const name = r.submission?.venueName || "未知";
      const entry = map.get(name) || { count: 0, totalRounds: 0 };
      entry.count++;
      entry.totalRounds += r.revisionRound;
      map.set(name, entry);
    });
    return Array.from(map.entries())
      .map(([journal, data]) => ({ journal, count: data.count, avgRounds: +(data.totalRounds / data.count).toFixed(1) }))
      .sort((a, b) => b.count - a.count);
  }, [revisions]);
  const statsByStudent = useMemo(() => {
    const map = new Map<string, number>();
    revisions.forEach(r => {
      const name = r.submission?.paper?.student?.name || "未知";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([student, count]) => ({ student, count }))
      .sort((a, b) => b.count - a.count);
  }, [revisions]);

  const statsDateEarliest = revisions.length > 0
    ? revisions.reduce((min, r) => r.receivedAt && r.receivedAt < min ? r.receivedAt : min, revisions[0]?.receivedAt || "")
    : null;
  const statsDateLatest = revisions.length > 0
    ? revisions.reduce((max, r) => r.receivedAt && r.receivedAt > max ? r.receivedAt : max, revisions[0]?.receivedAt || "")
    : null;

  function toggleSelect(id: number) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredRevisions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRevisions.map((r) => r.id)));
    }
  }

  function runAnalysis() {
    const selected = revisions.filter((r) => selectedIds.has(r.id));
    if (selected.length === 0) return;
    const results = analyzeReviews(selected);
    setAnalysisResults(results);
  }

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      pending: "bg-gray-100 text-gray-600",
      completed: "bg-green-100 text-green-700",
      overdue: "bg-red-100 text-red-700",
      in_progress: "bg-blue-100 text-blue-700",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  }

  function getTypeBadge(type: string) {
    const map: Record<string, string> = {
      minor: "bg-blue-100 text-blue-700",
      major: "bg-orange-100 text-orange-700",
      resubmit: "bg-red-100 text-red-700",
    };
    return map[type] || "bg-gray-100 text-gray-600";
  }

  return (
    <Tabs defaultValue="ai">
      <TabsList className="mb-4">
        <TabsTrigger value="ai">AI 分析</TabsTrigger>
        <TabsTrigger value="stats">统计分析</TabsTrigger>
      </TabsList>
      <TabsContent value="ai" className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">学生</label>
              <NativeSelect value={studentFilter} onValueChange={setStudentFilter}>
                <option value="all">全部学生</option>
                {students.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">期刊/会议</label>
              <NativeSelect value={venueFilter} onValueChange={setVenueFilter}>
                <option value="all">全部</option>
                {venues.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">返修类型</label>
              <NativeSelect value={typeFilter} onValueChange={setTypeFilter}>
                <option value="all">全部类型</option>
                <option value="minor">小修</option>
                <option value="major">大修</option>
                <option value="resubmit">重投</option>
              </NativeSelect>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">开始日期</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">结束日期</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">关键词搜索</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-8"
                  placeholder="搜索评论内容..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            共 {filteredRevisions.length} 条记录
          </span>
          {selectedIds.size > 0 && (
            <span className="text-sm text-blue-600">
              已选 {selectedIds.size} 项
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSelectAll}
          >
            {selectedIds.size === filteredRevisions.length && filteredRevisions.length > 0 ? "取消全选" : "全选"}
          </Button>
          <Button
            size="sm"
            disabled={selectedIds.size === 0}
            onClick={runAnalysis}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            AI 分析选中
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="w-10 px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedIds.size === filteredRevisions.length && filteredRevisions.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">学生</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">论文题目</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">期刊</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">类型</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">收到日期</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">状态</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">评论摘要</th>
              </tr>
            </thead>
            <tbody>
              {filteredRevisions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-400">
                    暂无匹配的返修记录
                  </td>
                </tr>
              ) : (
                filteredRevisions.map((rev) => (
                  <>
                    <tr
                      key={rev.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === rev.id ? null : rev.id)}
                    >
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={selectedIds.has(rev.id)}
                          onChange={() => toggleSelect(rev.id)}
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">
                        {rev.submission?.paper?.student?.name || "-"}
                      </td>
                      <td className="px-3 py-2 max-w-[200px] truncate">
                        {rev.submission?.paper?.title || "-"}
                      </td>
                      <td className="px-3 py-2">{rev.submission?.venueName || "-"}</td>
                      <td className="px-3 py-2">
                        <Badge className={getTypeBadge(rev.revisionType)}>
                          {{ minor: "小修", major: "大修", resubmit: "重投" }[rev.revisionType] || rev.revisionType}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        {rev.receivedAt ? new Date(rev.receivedAt).toLocaleDateString("zh-CN") : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <Badge className={getStatusBadge(rev.status)}>
                          {{ pending: "待处理", completed: "已完成", overdue: "逾期", in_progress: "进行中", revising: "返修中", submitted: "已提交" }[rev.status] || rev.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 max-w-[250px] truncate text-gray-500">
                        {(rev.commentsSummary || rev.submission?.reviewerComments) ? (
                          <span className="flex items-center gap-1">
                            {(rev.commentsSummary || rev.submission?.reviewerComments || "").slice(0, 60)}
                            {((rev.commentsSummary || rev.submission?.reviewerComments || "").length > 60) && "..."}
                            {expandedRow === rev.id ? (
                              <ChevronDown className="h-3 w-3 shrink-0" />
                            ) : (
                              <ChevronRight className="h-3 w-3 shrink-0" />
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-300">无评论</span>
                        )}
                      </td>
                    </tr>
                    {expandedRow === rev.id && (
                      <tr key={`${rev.id}-expanded`} className="bg-gray-50">
                        <td colSpan={8} className="px-3 py-3">
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">完整评论：</span>
                              <p className="mt-1 whitespace-pre-wrap text-gray-600">
                                {rev.commentsSummary || rev.submission?.reviewerComments || "无评论内容"}
                              </p>
                            </div>
                            {rev.responseSummary && (
                              <div>
                                <span className="font-medium text-gray-700">回复摘要：</span>
                                <p className="mt-1 whitespace-pre-wrap text-gray-600">{rev.responseSummary}</p>
                              </div>
                            )}
                            {rev.notes && (
                              <div>
                                <span className="font-medium text-gray-700">备注：</span>
                                <p className="mt-1 whitespace-pre-wrap text-gray-600">{rev.notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Analysis Results */}
      {analysisResults && analysisResults.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            分析结果
            <span className="text-sm font-normal text-gray-400">
              （基于 {selectedIds.size} 条返修评论的关键词匹配分析）
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysisResults.map((result) => (
              <Card key={result.category} className={`border ${result.color}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{result.category}</span>
                    <Badge variant="outline" className="text-sm ml-2">
                      {result.count} 条
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="cursor-pointer flex items-center justify-between text-xs text-gray-500"
                    onClick={() => setExpandedCategory(expandedCategory === result.category ? null : result.category)}
                  >
                    <span>点击查看详情</span>
                    {expandedCategory === result.category ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </div>
                  {expandedCategory === result.category && (
                    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                      {result.excerpts.map((ex, idx) => (
                        <div key={idx} className="rounded border bg-white p-2 text-xs">
                          <div className="flex items-center gap-2 mb-1 text-gray-500">
                            <span className="font-medium text-gray-700">{ex.studentName}</span>
                            <span>{ex.venue}</span>
                          </div>
                          <p className="text-gray-600 line-clamp-3">{ex.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setAnalysisResults(null)}>
            清空分析结果
          </Button>
        </div>
      )}
      </TabsContent>
      <TabsContent value="stats" className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">返修总数</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{statsTotal}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">小修</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-yellow-600">{statsByType.minor}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">大修</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-orange-600">{statsByType.major}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">重投</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-red-600">{statsByType.resubmit}</span>
            </CardContent>
          </Card>
        </div>

        {/* Date range summary */}
        {statsDateEarliest && statsDateLatest && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">日期范围</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {new Date(statsDateEarliest).toLocaleDateString("zh-CN")} ~ {new Date(statsDateLatest).toLocaleDateString("zh-CN")}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">按期刊统计</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>期刊/会议</TableHead>
                    <TableHead className="text-right">返修数</TableHead>
                    <TableHead className="text-right">平均轮次</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsByJournal.map((item) => (
                    <TableRow key={item.journal}>
                      <TableCell>{item.journal}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell className="text-right">{item.avgRounds}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">按学生统计</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生</TableHead>
                    <TableHead className="text-right">返修数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsByStudent.map((item) => (
                    <TableRow key={item.student}>
                      <TableCell>{item.student}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
