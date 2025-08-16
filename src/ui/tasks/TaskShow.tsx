import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api";
import type { TaskDetail, TaskStatus } from "../../types";

export function TaskShow() {
  const { id } = useParams();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<TaskStatus | "">("");

  useEffect(() => {
    if (!id) return;
    api.getTask(id).then(t => { setTask(t); setStatus(t.status); }).catch(console.error);
  }, [id]);

  if (!task) return <div>Loading…</div>;

  async function saveStatus() {
    if (!id || !status) return;
    await api.setTaskStatus(id, status as TaskStatus);
    const updated = await api.getTask(id);
    setTask(updated);
  }

  async function saveReason() {
    if (!id || !status || !reason.trim()) return;
    await api.addReason(id, status as TaskStatus, reason.trim());
    setReason("");
  }

  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>{task.name}</h2>
        <div className="row">
          <span className="badge">{task.category}</span>
          <select className="select" style={{ marginLeft: 8 }} value={status || task.status} onChange={e => setStatus(e.target.value as TaskStatus)}>
            {(["todo","started","in-progress","stage-complete","completed","dropped"] as TaskStatus[]).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="button" style={{ marginLeft: 8 }} onClick={saveStatus}>Update Status</button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="label">Short summary</div>
          <p>{task.short_summary || "—"}</p>
          <div className="label" style={{ marginTop: 12 }}>Description</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{task.description || "—"}</div>
        </div>

        <div className="card">
          <div className="label">Meta</div>
          <div>Status: {task.status}</div>
          <div>Current stage: {task.current_stage || "—"}</div>
          <div>Start: {task.start_at ? new Date(task.start_at).toLocaleString() : "—"}</div>
          <div>End (est): {task.end_est_at ? new Date(task.end_est_at).toLocaleString() : "—"}</div>
          <div>Updated: {new Date(task.updated_at).toLocaleString()}</div>
        </div>
      </div>

      <div className="card">
        <h3>Reasoning</h3>
        <p className="label">Add reasoning for current status</p>
        <div className="row">
          <textarea className="textarea" rows={3} value={reason} onChange={e => setReason(e.target.value)} />
          <button className="button" onClick={saveReason}>Save Reason</button>
        </div>
        <p className="label" style={{ marginTop: 10 }}>
          (History rendering is backend-dependent—expose a list endpoint when ready.)
        </p>
      </div>
    </div>
  );
}
