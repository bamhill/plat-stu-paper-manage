"use client";

import { useState } from "react";
import { ThesisTable } from "@/components/theses/thesis-table";
import { ThesisForm } from "@/components/theses/thesis-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function ThesisListClient({ theses }: { theses: any[] }) {
  const [showForm, setShowForm] = useState(false);
  return (
    <>
      <div className="mb-4"><Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" />添加大论文</Button></div>
      <ThesisTable theses={theses} />
      <ThesisForm open={showForm} onOpenChange={setShowForm} thesis={null} />
    </>
  );
}
