"use client";

import { useState } from "react";
import { PaperTable } from "@/components/papers/paper-table";
import { PaperForm } from "@/components/papers/paper-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function PaperListClient({ papers }: { papers: any[] }) {
  const [showForm, setShowForm] = useState(false);
  return (
    <>
      <div className="mb-4"><Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" />添加小论文</Button></div>
      <PaperTable papers={papers} />
      <PaperForm open={showForm} onOpenChange={setShowForm} paper={null} />
    </>
  );
}
