import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import type { IdeaRow, IdeaStatus, ProjectOption } from "../../types";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";

import { DataTable } from "@/components/data-table";
import { MetricCard, type SparkPoint } from "@/components/metric-card";

const DEFAULT_PROJECT_ID = "prj_personal_general";
const ALL = "__all__";
const STATUSES: IdeaStatus[] = ["inbox", "exploring", "building", "paused", "shipped", "dropped"];

export function IdeasList() {
  const [rows, setRows] = useState<IdeaRow[]>([]);
 const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [project, setProject] = useState(DEFAULT_PROJECT_ID);

  useEffect(() => {
    api.listProjects().then((ps) => {
      setProjects(ps);
      const preferred = ps.find(p => p.id === DEFAULT_PROJECT_ID) ?? ps[0];
      if (preferred) setProject(preferred.id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    api.listIdeas(project).then(setRows).catch(console.error);
  }, [project]);

  // KPI stats
  const { total, active, shipped, dropped, spark } = useMemo(() => {
    const total = rows.length;
    const shipped = rows.filter(r => r.status === "shipped").length;
    const dropped = rows.filter(r => r.status === "dropped").length;
    const active = rows.filter(r => ["inbox","exploring","building","paused"].includes(String(r.status))).length;

    const sorted = [...rows].sort((a, b) =>
      new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    );
    const spark: SparkPoint[] = sorted.length
      ? sorted.map((_, i) => ({ x: i, y: i + 1 }))
      : [{ x: 0, y: 0 }];

    return { total, active, shipped, dropped, spark };
  }, [rows]);

  // columns (local)
const columns: ColumnDef<IdeaRow>[] = [
  {
    id: "title",
    header: "Title",
    accessorKey: "title",
    cell: ({ row, getValue }) => {
      const original = row?.original as Partial<IdeaRow> | undefined;
      const id = original?.id;
      const title = (getValue() as string) ?? "Untitled";
      return id ? (
        <Link className="underline-offset-2 hover:underline" to={`/ideas/${id}`}>
          {title}
        </Link>
      ) : (
        <span>{title}</span>
      );
    },
  },
  { id: "status", header: "Status", accessorKey: "status" },
  { id: "priority", header: "Priority", accessorKey: "priority" },
  { id: "updated_at", header: "Updated", accessorKey: "updated_at" },
];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Ideas</h2>
        <div className="flex gap-2">
          <Select value={project} onValueChange={setProject}>
    <SelectTrigger className="w-[240px]">
      <SelectValue placeholder="Select project" />
    </SelectTrigger>
    <SelectContent>
      {Array.from(new Map(projects.map(p => [p.workspace_id, p.workspace_name])).entries())
        .map(([wsId, wsName]) => (
          <SelectGroup key={wsId}>
            <SelectLabel>{wsName}</SelectLabel>
            {projects.filter(p => p.workspace_id === wsId).map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectGroup>
      ))}
    </SelectContent>
  </Select>
          <Button asChild><Link to="/ideas/new">New Idea</Link></Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Ideas" value={total} hint="All ideas" data={spark} tone="tinted" accent="amber" dots="last" fill="none" />
        <MetricCard title="Active" value={active} hint="inbox/working/paused" data={spark} tone="subtle" accent="sky" dots="last" fill="none" />
        <MetricCard title="Shipped" value={shipped} hint={`${Math.round((shipped / Math.max(total, 1)) * 100)}% shipped`} data={spark} tone="subtle" accent="emerald" dots="last" fill="soft" />
        <MetricCard title="Dropped" value={dropped} hint="abandoned" data={spark} tone="subtle" accent="rose" dots="last" fill="none" />
      </div>

      {/* Table with quick filters */}
      <Card>
        <CardContent className="pt-4">
          <DataTable
            columns={columns as any}
            data={(rows ?? []).filter(Boolean) as IdeaRow[]}
            pageSize={10}
            renderToolbar={(table) => {
              const titleCol = table.getColumn("title");
              const statusCol = table.getColumn("status");
              const statusValue = (statusCol?.getFilterValue() as string) ?? "";
              return (
                <>
                  <Input
                    placeholder="Search by title…"
                    value={(titleCol?.getFilterValue() as string) ?? ""}
                    onChange={(e) => titleCol?.setFilterValue(e.target.value)}
                    className="w-[240px]"
                  />
                  <Select
                    value={statusValue === "" ? ALL : statusValue}
                    onValueChange={(v) => statusCol?.setFilterValue(v === ALL ? "" : v)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All status</SelectItem>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
