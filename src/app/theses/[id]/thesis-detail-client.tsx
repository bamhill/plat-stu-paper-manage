"use client";

import { useState } from "react";
import { ThesisReviewForm } from "@/components/theses/thesis-review-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { AttachmentUpload } from "@/components/shared/attachment-upload";
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

  const reviews = thesis.reviews || [];

  // Filter external/anonymous reviews for score slots (up to 3)
  const externalReviews = reviews.filter(
    (r: any) => r.reviewerType === "external" || r.reviewerType === "anonymous"
  ).slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Progress + External Score Slots */}
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

        {/* External review score cards */}
        {externalReviews.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-medium text-sm text-gray-500">外审评分</h2>
            {externalReviews.map((r: any, i: number) => (
              <div key={r.id} className="rounded-lg border bg-white p-3 space-y-1">
                <div className="text-xs text-gray-400">外审专家{i + 1}</div>
                <div className="font-medium text-sm">{r.reviewerName || "未命名"}</div>
                {r.score && <div className="text-lg font-bold text-blue-600">{r.score}分</div>}
                <StatusBadge value={r.decision} />
              </div>
            ))}
          </div>
        )}

        {thesis.score && (
          <div className="rounded-lg border bg-gray-50 p-3">
            <span className="text-gray-500 text-sm">综合评分：</span>
            <span className="font-bold text-lg">{thesis.score}</span>
          </div>
        )}
      </div>

      {/* Right: Reviews + Attachments */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">审稿意见</h2>
          <Button size="sm" onClick={() => setShowReviewForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />添加审稿意见
          </Button>
        </div>

        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无审稿意见，请添加外审专家评审</p>
        ) : (
          reviews.map((r: any) => (
            <div key={r.id} className="rounded-lg border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.reviewerName}</span>
                  <StatusBadge value={r.reviewerType} />
                </div>
                <StatusBadge value={r.decision} />
              </div>
              {r.score && (
                <p className="text-sm">
                  <span className="text-gray-500">分数：</span>
                  <span className="font-bold text-blue-600">{r.score}</span>
                </p>
              )}
              {r.comments && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-2">
                  {r.comments}
                </p>
              )}
              {r.reviewedAt && (
                <p className="text-xs text-gray-400">评审日期：{format(new Date(r.reviewedAt), "yyyy-MM-dd")}</p>
              )}

              {/* Attachments for this review */}
              <div className="pt-2 border-t">
                <AttachmentUpload
                  relatedType="thesis_review"
                  relatedId={r.id}
                  existingAttachments={(r.attachments || []).map((a: any) => ({
                    id: a.id,
                    fileName: a.fileName,
                    filePath: a.filePath,
                    fileSize: a.fileSize,
                    fileType: a.fileType,
                    description: a.description,
                    uploadedAt: a.uploadedAt,
                  }))}
                />
              </div>
            </div>
          ))
        )}

        {/* Thesis-level attachments */}
        <div className="pt-4 border-t">
          <h2 className="font-medium mb-3">大论文附件</h2>
          <AttachmentUpload
            relatedType="thesis"
            relatedId={thesis.id}
            existingAttachments={(thesis.attachments || []).map((a: any) => ({
              id: a.id,
              fileName: a.fileName,
              filePath: a.filePath,
              fileSize: a.fileSize,
              fileType: a.fileType,
              description: a.description,
              uploadedAt: a.uploadedAt,
            }))}
          />
        </div>

        <ThesisReviewForm open={showReviewForm} onOpenChange={setShowReviewForm} thesisId={thesis.id} />
      </div>
    </div>
  );
}
