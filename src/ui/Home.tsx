import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { WorkspaceOption, ProjectOption } from "../types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { MetricCard, type SparkPoint } from "@/components/metric-card";

const DEFAULT_PROJECT_ID = "prj_personal_general";

export function Home() {
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [wsId, setWsId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");

  // metrics
  const [tCount, setTCount] = useState<number>(0);
  const [iCount, setICount] = useState<number>(0);
  const [dCount, setDCount] = useState<number>(0);

  // fake spark (monotonic) so the cards look consistent
  const spark: SparkPoint[] = useMemo(
    () => Array.from({ length: Math.max(tCount + iCount + dCount, 1) }, (_, i) => ({ x: i, y: i + 1 })),
    [tCount, iCount, dCount]
  );

  useEffect(() => {
    // load workspaces + projects
    api.listWorkspaces().then((ws) => {
      setWorkspaces(ws);
      // pick personal/work first if present
      const preferredWs = ws.find(w => w.id === "ws_personal") ?? ws[0];
      if (preferredWs) setWsId(preferredWs.id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!wsId) return;
    api.listProjects(wsId).then((ps) => {
      setProjects(ps);
      const preferred = ps.find(p => p.id === DEFAULT_PROJECT_ID) ?? ps[0];
      if (preferred) setProjectId(preferred.id);
      else setProjectId("");
    }).catch(console.error);
  }, [wsId]);

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      api.countTasks(projectId).catch(() => 0),
      api.countIdeas(projectId).catch(() => 0),
      api.countDocs(projectId).catch(() => 0),
    ]).then(([tc, ic, dc]) => { setTCount(tc); setICount(ic); setDCount(dc); });
  }, [projectId]);

  // --- Create Workspace dialog ---
  const [openWs, setOpenWs] = useState(false);
  const [wsName, setWsName] = useState("");
  const [wsKind, setWsKind] = useState<"personal"|"work"|"custom">("custom");
  async function submitWorkspace() {
    if (!wsName.trim()) return;
    await api.createWorkspace({ name: wsName.trim(), kind: wsKind });
    const ws = await api.listWorkspaces();
    setWorkspaces(ws);
    setOpenWs(false);
    setWsName("");
  }

  // --- Create Project dialog ---
  const [openPrj, setOpenPrj] = useState(false);
  const [prjName, setPrjName] = useState("");
  const [prjDesc, setPrjDesc] = useState("");
  async function submitProject() {
    if (!prjName.trim() || !wsId) return;
    await api.createProject({ workspace_id: wsId, name: prjName.trim(), description: prjDesc || undefined, status: "active" });
    const ps = await api.listProjects(wsId);
    setProjects(ps);
    setOpenPrj(false);
    setPrjName(""); setPrjDesc("");
  }

  return (
    <div className="space-y-6">
      {/* Header + selectors */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Workspace */}
          <div className="space-y-2">
            <Label>Workspace</Label>
            <Select value={wsId} onValueChange={setWsId}>
              <SelectTrigger className="w-[260px]"><SelectValue placeholder="Select workspace" /></SelectTrigger>
              <SelectContent>
                {workspaces.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name} {w.kind !== "custom" ? `(${w.kind})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={!projects.length}>
              <SelectTrigger className="w-[260px]"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {/* group by workspace name if you ever show mixed list */}
                <SelectGroup>
                  <SelectLabel>Projects</SelectLabel>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Create buttons */}
        <div className="flex gap-2">
          <Dialog open={openWs} onOpenChange={setOpenWs}>
            <DialogTrigger asChild><Button variant="secondary">New Workspace</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader><DialogTitle>Create Workspace</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input value={wsName} onChange={e => setWsName(e.target.value)} placeholder="e.g., Personal" />
                </div>
                <div className="space-y-1">
                  <Label>Kind</Label>
                  <Select value={wsKind} onValueChange={v => setWsKind(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">personal</SelectItem>
                      <SelectItem value="work">work</SelectItem>
                      <SelectItem value="custom">custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setOpenWs(false)}>Cancel</Button>
                <Button onClick={submitWorkspace}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={openPrj} onOpenChange={setOpenPrj}>
            <DialogTrigger asChild><Button>New Project</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Workspace</Label>
                  <Select value={wsId} onValueChange={setWsId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {workspaces.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input value={prjName} onChange={e => setPrjName(e.target.value)} placeholder="e.g., General" />
                </div>
                <div className="space-y-1">
                  <Label>Description (optional)</Label>
                  <Input value={prjDesc} onChange={e => setPrjDesc(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setOpenPrj(false)}>Cancel</Button>
                <Button onClick={submitProject} disabled={!wsId || !prjName.trim()}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Tasks"
          value={tCount}
          hint="in selected project"
          data={spark}
          tone="tinted"
          accent="sky"
          dots="last"
          fill="none"
        />
        <MetricCard
          title="Ideas"
          value={iCount}
          hint="in selected project"
          data={spark}
          tone="subtle"
          accent="amber"
          dots="last"
          fill="soft"
        />
        <MetricCard
          title="Docs"
          value={dCount}
          hint="in selected project"
          data={spark}
          tone="subtle"
          accent="emerald"
          dots="last"
          fill="none"
        />
      </div>

      <Separator />

      {/* You can add quick actions here later (create task/idea/doc preselected to this project) */}
    </div>
  );
}
