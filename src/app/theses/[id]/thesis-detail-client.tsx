"use client";

import { useState } from "react";
import { ThesisReviewForm } from "@/components/theses/thesis-review-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { AttachmentUpload } from "@/components/shared/attachment-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { updateThesis } from "@/app/theses/actions";

const STAGES = [
  { key: "proposal", label: "开题", dateField: "proposalDate" as string | null },
  { key: "draft", label: "初稿", dateField: null as string | null },
  { key: "review", label: "外审", dateField: null as string | null },
  { key: "revision", label: "修改", dateField: null as string | null },
  { key: "defense", label: "答辩", dateField: "defenseDate" as string | null },
  { key: "archived", label: "归档", dateField: null as string | null },
];

const EXPERT_SLOTS = ["外审专家一", "外审专家二", "外审专家三"];

export function ThesisDetailClient({ thesis }: { thesis: any }) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editScore, setEditScore] = useState(false);
  const [finalScore, setFinalScore] = useState(thesis.score || "");
  const currentStageIdx = STAGES.findIndex(s => s.key === thesis.stage);

  const reviews = thesis.reviews || [];

  async function saveFinalScore() {
    try {
      await updateThesis(thesis.id, { ...thesis, score: finalScore || null, proposalDate: thesis.proposalDate, defenseDate: thesis.defenseDate } as any);
      toast.success("答辩成绩已保存");
      setEditScore(false);
    } catch { toast.error("保存失败"); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Progress */}
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

        {/* Final Defense Score */}
        <div className="rounded-lg border bg-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">答辩成绩</span>
            <Button variant="ghost" size="icon" onClick={() => setEditScore(!editScore)}>
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
          {editScore ? (
            <div className="flex gap-2">
              <Input value={finalScore} onChange={e => setFinalScore(e.target.value)} placeholder="如: 85" className="h-8" />
              <Button size="sm" onClick={saveFinalScore}>保存</Button>
            </div>
          ) : (
            <div className="text-xl font-bold text-blue-600">{thesis.score || "未录入"}{thesis.score ? "分" : ""}</div>
          )}
        </div>
      </div>

      {/* Right: 3 Expert Reviews + Attachments */}
      <div className="lg:col-span-2 space-y-6">
        <h2 className="font-medium">外审专家评审</h2>

        {EXPERT_SLOTS.map((label, idx) => {
          const review = reviews[idx];
          return (
            <div key={idx} className="rounded-lg border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">{label}</h3>
                {review ? (
                  <StatusBadge value={review.decision} />
                ) : (
                  <Button size="sm" variant="outline" onClick={() => {
                    setActiveSlot(idx);
                    setShowReviewForm(true);
                  }}>
                    <Plus className="h-3 w-3 mr-1" />录入评审
                  </Button>
                )}
              </div>

              {review && (
                <>
                  <div className="flex items-center gap-4 text-sm">
                    <span>评审人：<span className="font-medium">{review.reviewerName}</span></span>
                    <span>类型：<StatusBadge value={review.reviewerType} /></span>
                    {review.score && <span>分数：<span className="font-bold text-blue-600">{review.score}分</span></span>}
                    {review.reviewedAt && <span className="text-gray-400 text-xs">日期：{format(new Date(review.reviewedAt), "yyyy-MM-dd")}</span>}
                  </div>
                  {review.comments && (
                    <div className="bg-gray-50 rounded p-2 text-sm whitespace-pre-wrap">{review.comments}</div>
                  )}
                  {/* Attachments for this review */}
                  <div className="pt-2 border-t">
                    <AttachmentUpload
                      relatedType="thesis_review"
                      relatedId={review.id}
                      existingAttachments={(review.attachments || []).map((a: any) => ({
                        id: a.id, fileName: a.fileName, filePath: a.filePath,
                        fileSize: a.fileSize, fileType: a.fileType,
                        description: a.description, uploadedAt: a.uploadedAt,
                      }))}
                    />
                  </div>
                </>
              )}
              {!review && (
                <p className="text-xs text-gray-400">点击录入评审添加外审专家评分和意见</p>
              )}
            </div>
          );
        })}

        {/* Thesis-level attachments */}
        <div className="pt-4 border-t">
          <h2 className="font-medium mb-3">大论文附件</h2>
          <AttachmentUpload
            relatedType="thesis"
            relatedId={thesis.id}
            existingAttachments={(thesis.attachments || []).map((a: any) => ({
              id: a.id, fileName: a.fileName, filePath: a.filePath,
              fileSize: a.fileSize, fileType: a.fileType,
              description: a.description, uploadedAt: a.uploadedAt,
            }))}
          />
        </div>

        <ThesisReviewForm open={showReviewForm} onOpenChange={setShowReviewForm} thesisId={thesis.id} />
      </div>
    </div>
  );
}
