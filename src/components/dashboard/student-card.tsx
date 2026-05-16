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
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-sm">{student.name}</div>
              <div className="text-xs text-gray-400">{student.direction}</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </div>
        {papers.length === 0 ? (
          <p className="text-xs text-gray-400">暂无论文</p>
        ) : (
          <div className="space-y-1.5">
            {displayPapers.map((paper: any) => (
              <div key={paper.id} className="rounded border p-2 text-xs flex items-center justify-between gap-2">
                <span className="font-medium truncate flex-1">{paper.targetVenue && <span className="text-gray-400">({paper.targetVenue}) </span>}{paper.title}</span>
                <StatusBadge value={paper.status} />
              </div>
            ))}
            {moreCount > 0 && (
              <p className="text-xs text-blue-600">+{moreCount} 篇</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
