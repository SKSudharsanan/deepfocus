import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import type { TaskRow, TaskStatus } from "../../types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { DataTable } from "@/components/data-table";
import { taskColumns } from "./columns";
import { MetricCard, type SparkPoint } from "@/components/metric-card";

const ALL = "__all__";
const STATUSES: TaskStatus[] = ["todo", "started", "in-progress", "stage-complete", "completed", "dropped"];
const INPROG: TaskStatus[] = ["started", "in-progress"];
const DONE: TaskStatus[] = ["completed"];

export function TasksList() {
  const [rows, setRows] = useState<TaskRow[]>([]);

  useEffect(() => {
    api.listTasks().then(setRows).catch(console.error);
  }, []);

  // categories for filter select
  const categories = useMemo(
    () => Array.from(new Set(rows.map(r => r.category))).filter(Boolean).sort(),
    [rows]
  );

  // --- KPI stats + sparkline (simple “cumulative items touched by updated_at”) ---
  const { total, completed, inprog, spark } = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter(r => DONE.includes(r.status)).length;
    const inprog = rows.filter(r => INPROG.includes(r.status)).length;

    const sorted = [...rows].sort(
      (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    );
    const spark: SparkPoint[] = sorted.length
      ? sorted.map((_, i) => ({ x: i, y: i + 1 }))
      : [{ x: 0, y: 0 }];

    return { total, completed, inprog, spark };
  }, [rows]);

  async function handleStatusChange(id: string, next: TaskStatus) {
    await api.setTaskStatus(id, next);
    setRows(await api.listTasks());
  }

  const columns = taskColumns({ onStatusChange: handleStatusChange });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <Button asChild><Link to="/tasks/new">New Task</Link></Button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Tasks"
          value={total}
          hint="All tasks"
          data={spark}
          tone="tinted"
          accent="amber"   // 🔶 visible on dark + light
          dots="last"      // small dot on the last point
          fill="none"
        />
        <MetricCard
          title="Completed"
          value={completed}
          hint={`${Math.round((completed / Math.max(total, 1)) * 100)}% completion`}
          data={spark}
          tone="subtle"
          accent="emerald"  // ✅ green
          dots="last"
          fill="soft"       // faint area looks nice for “completed”
        />
        <MetricCard
          title="In Progress"
          value={inprog}
          hint="started / in-progress"
          data={spark}
          tone="subtle"
          accent="sky"      // ✅ blue
          dots="last"
          fill="none"
        />
      </div>

      {/* Table with built-in toolbar filters */}
      <Card>
        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={rows}
            pageSize={10}
            renderToolbar={(table) => {
              // We'll filter by column id: "name", "category", "status"
              const nameCol = table.getColumn("name");
              const categoryCol = table.getColumn("category");
              const statusCol = table.getColumn("status");

              const categoryValue = (categoryCol?.getFilterValue() as string) ?? "";
              const statusValue = (statusCol?.getFilterValue() as string) ?? "";

              return (
                <>
                  <Input
                    placeholder="Search by name…"
                    value={(nameCol?.getFilterValue() as string) ?? ""}
                    onChange={(e) => nameCol?.setFilterValue(e.target.value)}
                    className="w-[240px]"
                  />

                  <Select
                    value={categoryValue === "" ? ALL : categoryValue}
                    onValueChange={(v) => categoryCol?.setFilterValue(v === ALL ? "" : v)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={statusValue === "" ? ALL : statusValue}
                    onValueChange={(v) => statusCol?.setFilterValue(v === ALL ? "" : v)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All status</SelectItem>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              );
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
