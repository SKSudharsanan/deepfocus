import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import type { TaskInput, TaskStatus } from "../../types";
import {localToIsoUtc, isoUtcToLocalInput} from "./dateTime"

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
    <div className="col" style={{ gap: 12 }}>
      <h2>Create Task</h2>
      <div className="card">
        <div className="row" style={{ gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div className="label">Task name</div>
            <input className="input" value={form.name} onChange={e => update("name", e.target.value)} />
          </div>
          <div style={{ width: 260 }}>
            <div className="label">Category</div>
            <input className="input" value={form.category} onChange={e => update("category", e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="label">Short summary</div>
          <input className="input" value={form.short_summary} onChange={e => update("short_summary", e.target.value)} />
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="label">Description (markdown allowed)</div>
          <textarea className="textarea" rows={6} value={form.description} onChange={e => update("description", e.target.value)} />
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <div>
            <div className="label">Status</div>
            <select className="select" value={form.status} onChange={e => update("status", e.target.value as TaskStatus)}>
              {(["todo","started","in-progress","stage-complete","completed","dropped"] as TaskStatus[]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="label">Current stage</div>
            <input className="input" value={form.current_stage} onChange={e => update("current_stage", e.target.value)} />
          </div>
          <div>
            <div className="label">Start time</div>
            <input
              className="input"
              type="datetime-local"
              value={isoUtcToLocalInput(form.start_at)}
              onChange={e => update("start_at", localToIsoUtc(e.target.value || null))}
            />
          </div>

          <div>
            <div className="label">End time (est)</div>
            <input
              className="input"
              type="datetime-local"
              value={isoUtcToLocalInput(form.end_est_at)}
              onChange={e => update("end_est_at", localToIsoUtc(e.target.value || null))}
            />
          </div>
        </div>
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 16 }}>
          <button className="button secondary" onClick={() => history.back()}>Cancel</button>
          <button className="button" onClick={submit}>Submit Task</button>
        </div>
      </div>
    </div>
  );
}
