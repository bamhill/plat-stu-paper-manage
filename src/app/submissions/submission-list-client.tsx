"use client";

import { useState } from "react";
import { SubmissionTable } from "@/components/submissions/submission-table";
import { SubmissionForm } from "@/components/submissions/submission-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function SubmissionListClient({ submissions }: { submissions: any[] }) {
  const [showForm, setShowForm] = useState(false);
  return (
    <>
      <div className="mb-4"><Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" />添加投稿</Button></div>
      <SubmissionTable submissions={submissions} />
      <SubmissionForm open={showForm} onOpenChange={setShowForm} submission={null} />
    </>
  );
}
