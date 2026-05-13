"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

export function StudentCard({ student }: { student: any }) {
  const router = useRouter();
  const activePapers = student.papers?.filter(
    (p: any) => p.status !== "rejected" && p.status !== "published"
  ) ?? [];

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/students/${student.id}`)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-sm">{student.name}</div>
              <div className="text-xs text-gray-400">{student.direction}</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </div>
        {activePapers.length === 0 ? (
          <p className="text-xs text-gray-400">暂无活跃论文</p>
        ) : (
          <div className="space-y-2">
            {activePapers.slice(0, 3).map((paper: any) => (
              <div key={paper.id} className="rounded-md border p-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium truncate block max-w-[180px]">{paper.title}</span>
                  <StatusBadge value={paper.status} />
                </div>
                {paper.targetVenue && <span className="text-gray-400">目标：{paper.targetVenue}</span>}
                {paper.submissions?.[0]?.reviewerComments && (
                  <div className="mt-1 pt-1 border-t text-gray-500 truncate">
                    {paper.submissions[0].reviewerComments.slice(0, 60)}...
                  </div>
                )}
              </div>
            ))}
            {activePapers.length > 3 && (
              <p className="text-xs text-blue-600">+{activePapers.length - 3} 篇更多...</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
