-- tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  short_summary TEXT,
  description TEXT,
  status TEXT NOT NULL,           -- todo | started | in-progress | stage-complete | completed | dropped
  current_stage TEXT,
  start_at TIMESTAMP,
  end_est_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- reasons for status changes
CREATE TABLE IF NOT EXISTS status_reasons (
  id TEXT PRIMARY KEY NOT NULL,
  task_id TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- optional per-task stages
CREATE TABLE IF NOT EXISTS task_stages (
  id TEXT PRIMARY KEY NOT NULL,
  task_id TEXT NOT NULL,
  name TEXT NOT NULL,
  summary TEXT,
  ord INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
CREATE INDEX IF NOT EXISTS idx_reasons_task ON status_reasons(task_id);