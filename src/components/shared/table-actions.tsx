import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TableActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" onClick={onEdit}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 className="h-3.5 w-3.5 text-red-500" />
      </Button>
    </div>
  );
}
