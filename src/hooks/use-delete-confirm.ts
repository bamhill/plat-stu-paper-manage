import { useState } from "react";

export function useDeleteConfirm<T>() {
  const [target, setTarget] = useState<T | null>(null);

  return {
    deleteTarget: target,
    isOpen: !!target,
    openDelete: (item: T) => setTarget(item),
    closeDelete: () => setTarget(null),
  };
}
