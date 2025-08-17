import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api";
import type { IdeaDetail, IdeaStatus } from "../../types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreateTaskFromIdeaDialog } from "@/components/create-task-from-idea";

const STATUSES: IdeaStatus[] = ["inbox", "exploring", "building", "paused", "shipped", "dropped"];

function fmt(v?: string | null) {
  if (!v) return "—";
  try { return new Date(v).toLocaleString(); } catch { return v; }
}

export function IdeaShow() {
  const { id } = useParams<{ id: string }>();
  const [idea, setIdea] = useState<IdeaDetail | null>(null);

  // local editing
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<IdeaStatus>("inbox");
  const [priority, setPriority] = useState(2);
  const [note, setNote] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  useEffect(() => {
    if (!id) return;
    api.getIdea(id).then((d) => {
      setIdea(d);
      setTitle(d.title);
      setSummary(d.summary ?? "");
      setStatus(d.status as IdeaStatus);
      setPriority(d.priority ?? 2);
    }).catch(console.error);
  }, [id]);

  async function pushUpdate(p: Partial<IdeaDetail>) {
    if (!id) return;
    await api.updateIdea({ id, ...p });
    setIdea(await api.getIdea(id));
  }

  async function changeStatus(next: IdeaStatus) {
    setStatus(next);
    await pushUpdate({ status: next });
  }

  async function saveMeta() {
    await pushUpdate({ title, summary, priority });
  }

  async function addNote() {
    if (!id || !note.trim()) return;
    await api.addIdeaNote(id, note.trim());
    setNote("");
  }

  async function addLink() {
    if (!id || !linkUrl.trim()) return;
    await api.addIdeaLink({ idea_id: id, kind: "ref", url: linkUrl.trim(), title: linkTitle || undefined });
    setLinkUrl(""); setLinkTitle("");
  }

  if (!idea) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">{idea.title}</h2>
          <Badge variant="outline">Priority {idea.priority}</Badge>
          <Badge variant="secondary">{idea.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary"><Link to="/ideas">Back</Link></Button>
          <CreateTaskFromIdeaDialog ideaId={idea.id} />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: IdeaStatus) => changeStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={String(priority)} onValueChange={v => setPriority(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[0,1,2,3,4].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Updated</Label>
              <div className="text-sm">{fmt(idea.updated_at)}</div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Summary</Label>
              <Input value={summary} onChange={e => setSummary(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveMeta}>Save</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a quick note…" />
          <div className="flex justify-end"><Button variant="secondary" onClick={addNote}>Add Note</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Links</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>URL</Label>
            <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-2">
            <Label>Title (optional)</Label>
            <Input value={linkTitle} onChange={e => setLinkTitle(e.target.value)} />
          </div>
          <div className="flex items-end"><Button onClick={addLink}>Add</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
