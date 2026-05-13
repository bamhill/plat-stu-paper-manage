"use client";

import { useState } from "react";
import { RevisionTable } from "@/components/revisions/revision-table";
import { RevisionForm } from "@/components/revisions/revision-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function RevisionListClient({ revisions }: { revisions: any[] }) {
  const [showForm, setShowForm] = useState(false);
  return (
    <>
      <div className="mb-4"><Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" />添加返修</Button></div>
      <RevisionTable revisions={revisions} />
      <RevisionForm open={showForm} onOpenChange={setShowForm} revision={null} />
    </>
  );
}
