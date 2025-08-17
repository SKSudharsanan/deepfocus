import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import type { TaskInput, TaskStatus } from "../../types";
import { localToIsoUtc, isoUtcToLocalInput } from "./dateTime";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";

const STATUSES: TaskStatus[] = [
  "todo",
  "started",
  "in-progress",
  "stage-complete",
  "completed",
  "dropped",
];

export function TaskCreate() {
  const nav = useNavigate();
  const [form, setForm] = useState<TaskInput>({
    name: "",
    category: "General",
    short_summary: "",
    description: "",
    status: "todo",
    current_stage: "Todo",
    start_at: null,
    end_est_at: null,
  });

  const update = (k: keyof TaskInput, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.name.trim()) return alert("Task name is required");
    if (form.start_at && form.end_est_at) {
      if (new Date(form.end_est_at) < new Date(form.start_at)) {
        return alert("End time must be after start time");
      }
    }
    const id = await api.addTask(form);
    nav(`/tasks/${id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Create Task</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => history.back()}>Cancel</Button>
          <Button onClick={submit}>Submit Task</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-2">
              <Label>Task name</Label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={form.category} onChange={e => update("category", e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
              <Label>Short summary</Label>
              <Input value={form.short_summary ?? ""} onChange={e => update("short_summary", e.target.value)} />
            </div>
             <div className="space-y-2">
              <Label>Current stage</Label>
              <Input value={form.current_stage ?? ""} onChange={e => update("current_stage", e.target.value)} />
            </div>
          </div>

            <div className="space-y-2">
            <Label>Description (markdown allowed)</Label>
            <Textarea rows={6} value={form.description ?? ""} onChange={e => update("description", e.target.value)} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
             <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: TaskStatus) => update("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

              <div className="space-y-2">
              <Label>Start time</Label>
              <Input
                type="datetime-local"
                value={isoUtcToLocalInput(form.start_at)}
                onChange={e => update("start_at", localToIsoUtc(e.target.value || null))}
              />
            </div>
            <div className="space-y-2">
              <Label>End time (est)</Label>
              <Input
                type="datetime-local"
                value={isoUtcToLocalInput(form.end_est_at)}
                onChange={e => update("end_est_at", localToIsoUtc(e.target.value || null))}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
