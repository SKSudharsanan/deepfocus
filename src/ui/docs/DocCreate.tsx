import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ProjectOption } from "../../types";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel,
} from "@/components/ui/select";


const DEFAULT_PROJECT_ID = "prj_personal_general";

export function DocCreate() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("# New Document\n\nStart writing…");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT_ID);


  useEffect(() => {
    api.listProjects()
      .then((ps) => {
        setProjects(ps);
        const preferred = ps.find(p => p.id === DEFAULT_PROJECT_ID) ?? ps[0];
        if (preferred) setProjectId(preferred.id);
      })
      .catch(console.error);
  }, []);


  async function submit() {
    if (!title.trim()) return alert("Title is required");
    const id = await api.addDoc({ project_id: projectId, title, slug: slug || undefined, body_md: body, status: "draft" });
    nav(`/docs/${id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Create Document</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => history.back()}>Cancel</Button>
          <Button onClick={submit}>Create</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Project ID</Label>
             <Select value={projectId} onValueChange={setProjectId}>
      <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
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
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="optional" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Initial Content (Markdown)</Label>
            <Textarea rows={8} value={body} onChange={e => setBody(e.target.value)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
