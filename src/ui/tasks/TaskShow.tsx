import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../../api";
import type { TaskDetail, TaskStatus } from "../../types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const STATUSES: TaskStatus[] = [
  "todo",
  "started",
  "in-progress",
  "stage-complete",
  "completed",
  "dropped",
];

function fmt(v?: string | null) {
  if (!v) return "—";
  try { return new Date(v).toLocaleString(); } catch { return v; }
}

export function TaskShow() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!id) return;
    api.getTask(id).then(setTask).catch(console.error);
  }, [id]);

  const completionPct = useMemo(() => {
    if (!task) return "";
    // naive %: completed -> 100, dropped -> 0, others -> blank
    if (task.status === "completed") return "100%";
    return "";
  }, [task]);

  async function changeStatus(next: TaskStatus) {
    if (!task) return;
    await api.setTaskStatus(task.id, next);
    setTask(await api.getTask(task.id));
  }

  async function addReason() {
    if (!task || !reason.trim()) return;
    await api.addReason(task.id, task.status, reason.trim());
    setReason("");
    // optional: refresh task detail if you show a reasons list
  }

  if (!task) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">{task.name}</h2>
          <Badge variant="outline">{task.category}</Badge>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary"><Link to="/tasks">Back</Link></Button>
          {/* If you later add an edit flow */}
          {/* <Button>Edit</Button> */}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.short_summary ? (
            <p className="text-sm text-muted-foreground">{task.short_summary}</p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={task.status} onValueChange={(v: TaskStatus) => changeStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
              <div className="space-y-2">
              <Label>Current stage</Label>
              <div className="text-sm">{task.current_stage ?? "—"}</div>
            </div>
              <div className="space-y-2">
              <Label>Completion</Label>
              <div className="text-sm">{completionPct || "—"}</div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
              <Label>Start</Label>
              <div className="text-sm">{fmt(task.start_at)}</div>
            </div>
             <div className="space-y-2">
              <Label>End (est)</Label>
              <div className="text-sm">{fmt(task.end_est_at)}</div>
            </div>
              <div className="space-y-2">
              <Label>Last updated</Label>
              <div className="text-sm">{fmt(task.updated_at)}</div>
            </div>
          </div>

          {task.description ? (
            <>
              <Separator />
                <div className="space-y-2">
                <Label>Description</Label>
                <div className="prose prose-invert mt-1 max-w-none whitespace-pre-wrap text-sm">
                  {task.description}
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reasoning / Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder={`Why is the status "${task.status}"? Add a note…`}
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button variant="secondary" onClick={addReason}>Add Note</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
