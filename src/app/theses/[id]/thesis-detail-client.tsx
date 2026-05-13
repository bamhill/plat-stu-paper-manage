"use client";

import { useState } from "react";
import { ThesisReviewForm } from "@/components/theses/thesis-review-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";

const STAGES = [
  { key: "proposal", label: "开题", dateField: "proposalDate" },
  { key: "midterm", label: "中期检查", dateField: "midtermDate" },
  { key: "draft", label: "初稿", dateField: "submittedAt" },
  { key: "review", label: "外审", dateField: "reviewedAt" },
  { key: "revision", label: "修改", dateField: null },
  { key: "defense", label: "答辩", dateField: "defenseDate" },
  { key: "archived", label: "归档", dateField: null },
];

export function ThesisDetailClient({ thesis }: { thesis: any }) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const currentStageIdx = STAGES.findIndex(s => s.key === thesis.stage);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <h2 className="font-medium">进度</h2>
        <div className="space-y-1">
          {STAGES.map((stage, i) => {
            const dateVal = stage.dateField ? thesis[stage.dateField] : null;
            const isPast = i <= currentStageIdx;
            return (
              <div key={stage.key} className="flex items-center gap-3 text-sm">
                <div className={`w-3 h-3 rounded-full ${isPast ? "bg-blue-500" : "bg-gray-300"}`} />
                <span className={isPast ? "font-medium" : "text-gray-400"}>{stage.label}</span>
                {dateVal && <span className="text-gray-400 text-xs ml-auto">{format(new Date(dateVal), "yyyy-MM-dd")}</span>}
              </div>
            );
          })}
        </div>
        {thesis.score && (
          <div className="rounded-lg border bg-gray-50 p-3">
            <span className="text-gray-500 text-sm">分数：</span>
            <span className="font-bold text-lg">{thesis.score}</span>
          </div>
        )}
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">审稿意见</h2>
          <Button size="sm" onClick={() => setShowReviewForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />添加审稿意见
          </Button>
        </div>
        {thesis.reviews.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无审稿意见</p>
        ) : (
          thesis.reviews.map((r: any) => (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium">{r.reviewerName}</span>
                  <span className="ml-2"><StatusBadge value={r.reviewerType} /></span>
                </div>
                <StatusBadge value={r.decision} />
              </div>
              {r.score && <p className="text-sm text-gray-500 mb-1">分数：{r.score}</p>}
              {r.comments && <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-2">{r.comments}</p>}
              {r.reviewedAt && <p className="text-xs text-gray-400 mt-2">{format(new Date(r.reviewedAt), "yyyy-MM-dd")}</p>}
            </div>
          ))
        )}
        <ThesisReviewForm open={showReviewForm} onOpenChange={setShowReviewForm} thesisId={thesis.id} />
      </div>
    </div>
  );
}
