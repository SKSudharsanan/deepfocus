import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import type { TaskRow, TaskStatus } from "../../types";

export function TasksList() {
  const [rows, setRows] = useState<TaskRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  useEffect(() => {
    api.listTasks().then(setRows).catch(console.error);
  }, []);

  const categories = useMemo(() => Array.from(new Set(rows.map(r => r.category))), [rows]);

  const filtered = rows.filter(r => {
    const matchesQ = q ? (r.name.toLowerCase().includes(q.toLowerCase())) : true;
    const matchesStatus = status ? r.status === status : true;
    const matchesCat = category ? r.category === category : true;
    return matchesQ && matchesStatus && matchesCat;
  });

  return (
    <div className="col">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <h2>Tasks</h2>
        <Link to="/tasks/new" className="button">New Task</Link>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row">
          <input className="input" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
          <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All status</option>
            {(["todo","started","in-progress","stage-complete","completed","dropped"] as TaskStatus[]).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Current Stage</th>
              <th>Start</th>
              <th>End (est)</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td><Link to={`/tasks/${r.id}`}>{r.name}</Link></td>
                <td><span className="badge">{r.category}</span></td>
                <td>{r.status}</td>
                <td>{r.current_stage || "—"}</td>
                <td>{r.start_at ? new Date(r.start_at).toLocaleString() : "—"}</td>
                <td>{r.end_est_at ? new Date(r.end_est_at).toLocaleString() : "—"}</td>
                <td>{new Date(r.updated_at).toLocaleString()}</td>
                <td>
                  <StatusInline id={r.id} value={r.status} onChange={async s => {
                    await api.setTaskStatus(r.id, s);
                    const next = await api.listTasks();
                    setRows(next);
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusInline({ id, value, onChange }: { id: string; value: TaskStatus; onChange: (s: TaskStatus) => void | Promise<void> }) {
  return (
    <select className="select" value={value} onChange={e => onChange(e.target.value as TaskStatus)}>
      {(["todo","started","in-progress","stage-complete","completed","dropped"] as TaskStatus[]).map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
