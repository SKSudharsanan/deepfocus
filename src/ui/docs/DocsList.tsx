import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import type { ColumnDef } from "@tanstack/react-table";
import type { DocRow, ProjectOption } from "../../types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";

import { DataTable } from "@/components/data-table";
import { MetricCard, type SparkPoint } from "@/components/metric-card";

const DEFAULT_PROJECT_ID = "prj_personal_general";
const ALL = "__all__";
const STATUSES = ["draft", "in_review", "published"];

export function DocsList() {
  const [rows, setRows] = useState<DocRow[]>([]);
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
    api.listDocs(project).then(setRows).catch(console.error);
  }, [project]);

  // KPI stats
  const { total, drafts, published, spark } = useMemo(() => {
    const total = rows.length;
    const drafts = rows.filter(r => r.status === "draft" || r.status === "in_review").length;
    const published = rows.filter(r => r.status === "published").length;

    const sorted = [...rows].sort((a, b) =>
      new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    );
    const spark: SparkPoint[] = sorted.length
      ? sorted.map((_, i) => ({ x: i, y: i + 1 }))
      : [{ x: 0, y: 0 }];

    return { total, drafts, published, spark };
  }, [rows]);

  const columns: ColumnDef<DocRow>[] = [
  {
    id: "title",
    header: "Title",
    accessorKey: "title",
   cell: ({ row, getValue }) => {
  const id = (row?.original as any)?.id;
  const title = (getValue() as string) ?? "Untitled";
  return id ? (
    <Link className="underline-offset-2 hover:underline" to={`/docs/${id}`}>
      {title}
    </Link>
  ) : (
    <span>{title}</span>
  );
},
  },
  { id: "status", header: "Status", accessorKey: "status" },
  { id: "slug", header: "Slug", accessorKey: "slug" },
  { id: "updated_at", header: "Updated", accessorKey: "updated_at" },
];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Documents</h2>
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
          <Button asChild><Link to="/docs/new">New Doc</Link></Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Total Docs" value={total} hint="All documents" data={[]} tone="tinted" accent="amber" dots="last" fill="none" />
        <MetricCard title="Drafts" value={drafts} hint="draft + in_review" data={[]} tone="subtle" accent="sky" dots="last" fill="none" />
        <MetricCard title="Published" value={published} hint={`${Math.round((published / Math.max(total, 1)) * 100)}% published`} data={[]} tone="subtle" accent="emerald" dots="last" fill="soft" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          <DataTable
            columns={columns as any}
            data={rows}
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
