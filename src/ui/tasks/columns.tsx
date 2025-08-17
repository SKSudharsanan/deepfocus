import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import type { TaskRow, TaskStatus } from "../../types";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function formatDT(v?: string | null) {
  if (!v) return "—";
  try { return new Date(v).toLocaleString(); } catch { return v; }
}

export function taskColumns(opts: {
  onStatusChange: (id: string, next: TaskStatus) => Promise<void> | void;
}): ColumnDef<TaskRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const r = row.original;
        return <Link to={`/tasks/${r.id}`} className="font-medium hover:underline">{r.name}</Link>;
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const r = row.original;
        const statuses: TaskStatus[] = ["todo","started","in-progress","stage-complete","completed","dropped"];
        return (
          <Select defaultValue={r.status} onValueChange={(v: TaskStatus) => opts.onStatusChange(r.id, v)}>
            <SelectTrigger className={cn("h-8 w-[170px]")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: "current_stage",
      header: "Current Stage",
      cell: ({ row }) => row.original.current_stage ?? "—",
    },
    {
      accessorKey: "start_at",
      header: "Start",
      cell: ({ row }) => formatDT(row.original.start_at),
      sortingFn: "text",
    },
    {
      accessorKey: "end_est_at",
      header: "End (est)",
      cell: ({ row }) => formatDT(row.original.end_est_at),
      sortingFn: "text",
    },
    {
      accessorKey: "updated_at",
      header: "Updated",
      cell: ({ row }) => formatDT(row.original.updated_at),
      sortingFn: "text",
    },
  ];
}
