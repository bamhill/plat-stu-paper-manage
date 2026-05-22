import { TableCell, TableRow } from "@/components/ui/table";

export function EmptyTableRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center text-gray-400 py-8">暂无数据</TableCell>
    </TableRow>
  );
}
