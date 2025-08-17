import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import type { IdeaStatus, ProjectOption } from "../../types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from "@/components/ui/select";

const STATUSES: IdeaStatus[] = ["inbox", "exploring", "building", "paused", "shipped", "dropped"];
const DEFAULT_PROJECT_ID = "prj_personal_general";

export function IdeaCreate() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<IdeaStatus>("inbox");
  const [priority, setPriority] = useState(2);
  const [effort, setEffort] = useState(1);
  const [impact, setImpact] = useState(1);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState<string>(DEFAULT_PROJECT_ID);

  async function submit() {
    if (!title.trim()) return alert("Idea title is required");
    const id = await api.addIdea({
      project_id: projectId,
      title,
      summary,
      status,
      priority,
      effort_pts: effort,
      impact_pts: impact,
    });
    nav(`/ideas/${id}`);
  }

  useEffect(() => {
    api.listProjects()
      .then((ps) => {
        setProjects(ps);
        // prefer Personal/General if present, else first
        const preferred = ps.find(p => p.id === DEFAULT_PROJECT_ID) ?? ps[0];
        if (preferred) setProjectId(preferred.id);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Create Idea</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => history.back()}>Cancel</Button>
          <Button onClick={submit}>Submit Idea</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Project ID</Label>
              <Select value={projectId} onValueChange={setProjectId}>
      <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
      <SelectContent>
        {/* simple grouping by workspace */}
        {Array.from(new Map(projects.map(p => [p.workspace_id, p.workspace_name])).entries())
          .map(([wsId, wsName]) => (
            <SelectGroup key={wsId}>
              <SelectLabel>{wsName}</SelectLabel>
              {projects.filter(p => p.workspace_id === wsId).map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectGroup>
        ))}
      </SelectContent>
    </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Summary</Label>
            <Textarea rows={4} value={summary} onChange={e => setSummary(e.target.value)} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: IdeaStatus) => setStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority (0–4)</Label>
              <Select value={String(priority)} onValueChange={v => setPriority(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[0,1,2,3,4].map(p => <SelectItem key={p} value={String(p)}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Effort / Impact</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={String(effort)} onValueChange={v => setEffort(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={String(impact)} onValueChange={v => setImpact(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
