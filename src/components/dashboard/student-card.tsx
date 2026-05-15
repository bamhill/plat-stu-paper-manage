"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

export function StudentCard({ student }: { student: any }) {
  const router = useRouter();
  const papers = student.papers ?? [];
  // Active first, then completed
  const sorted = [...papers].sort((a, b) => {
    const aDone = a.status === "published" || a.status === "rejected";
    const bDone = b.status === "published" || b.status === "rejected";
    return aDone === bDone ? 0 : aDone ? 1 : -1;
  });
  const displayPapers = sorted.slice(0, 4);
  const moreCount = papers.length - 4;

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/students/${student.id}`)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-xs">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-xs">{student.name}</div>
              <div className="text-[10px] text-gray-400">{student.direction}</div>
            </div>
          </div>
          <ChevronRight className="h-3 w-3 text-gray-300" />
        </div>
        {papers.length === 0 ? (
          <p className="text-[10px] text-gray-400">暂无论文</p>
        ) : (
          <div className="space-y-1">
            {displayPapers.map((paper: any) => (
              <div key={paper.id} className="rounded border p-1.5 text-[10px] flex items-center justify-between gap-2">
                <span className="font-medium truncate flex-1">{paper.targetVenue && <span className="text-gray-400">({paper.targetVenue}) </span>}{paper.title}</span>
                <StatusBadge value={paper.status} />
              </div>
            ))}
            {moreCount > 0 && (
              <p className="text-[10px] text-blue-600">+{moreCount} 篇</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
