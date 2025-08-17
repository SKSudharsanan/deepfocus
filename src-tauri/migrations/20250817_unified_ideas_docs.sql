-- 2025-08-17_unified_ideas_docs.sql
-- One-shot migration: hierarchy + tasks wiring + Idea Tracker + Long-form Content
-- Safe for SQLite and existing data.


PRAGMA foreign_keys = ON;

----------------------------------------------------------------------
-- 1) Workspaces and Projects
----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS workspace (
  id         TEXT PRIMARY KEY NOT NULL,
  name       TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'custom',  -- personal | work | custom
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS project (
  id           TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'active', -- active | paused | archived
  created_at   TIMESTAMP NOT NULL,
  updated_at   TIMESTAMP NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspace(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_workspace ON project(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_status    ON project(status);

-- Seed handy defaults if missing
INSERT OR IGNORE INTO workspace (id, name, kind, created_at, updated_at)
VALUES
  ('ws_personal', 'Personal', 'personal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ws_work',     'Work',     'work',     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO project (id, workspace_id, name, description, status, created_at, updated_at)
VALUES
  ('prj_personal_general', 'ws_personal', 'General', '', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('prj_work_general',     'ws_work',     'General', '', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

----------------------------------------------------------------------
-- 2) Wire existing tasks to the hierarchy
--    Keeps your original tasks schema intact
----------------------------------------------------------------------

-- Add nullable FKs. If columns already exist, comment these two lines when re-running.
ALTER TABLE tasks ADD COLUMN project_id   TEXT REFERENCES project(id)   ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN workspace_id TEXT REFERENCES workspace(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_project    ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace  ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_start_at   ON tasks(start_at);
CREATE INDEX IF NOT EXISTS idx_tasks_end_est    ON tasks(end_est_at);

-- Backfill to Personal -> General by default
UPDATE tasks
SET workspace_id = COALESCE(workspace_id, 'ws_personal'),
    project_id   = COALESCE(project_id,   'prj_personal_general');

----------------------------------------------------------------------
-- 3) Shared tags (for ideas and docs)
----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tag (
  id    TEXT PRIMARY KEY NOT NULL,
  name  TEXT NOT NULL UNIQUE
);

----------------------------------------------------------------------
-- 4) Idea Tracker (project scoped)
----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS idea (
  id           TEXT PRIMARY KEY NOT NULL,
  project_id   TEXT NOT NULL,
  title        TEXT NOT NULL,
  summary      TEXT DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'inbox',   -- inbox | exploring | building | paused | shipped | dropped
  priority     INTEGER NOT NULL DEFAULT 2,      -- 0..4
  effort_pts   INTEGER DEFAULT 1,
  impact_pts   INTEGER DEFAULT 1,
  created_at   TIMESTAMP NOT NULL,
  updated_at   TIMESTAMP NOT NULL,
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_idea_project   ON idea(project_id);
CREATE INDEX IF NOT EXISTS idx_idea_status    ON idea(status);
CREATE INDEX IF NOT EXISTS idx_idea_updated   ON idea(updated_at);
CREATE INDEX IF NOT EXISTS idx_idea_priority  ON idea(priority);

CREATE TABLE IF NOT EXISTS idea_tag (
  idea_id TEXT NOT NULL,
  tag_id  TEXT NOT NULL,
  PRIMARY KEY (idea_id, tag_id),
  FOREIGN KEY (idea_id) REFERENCES idea(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)  REFERENCES tag(id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS idea_note (
  id         TEXT PRIMARY KEY NOT NULL,
  idea_id    TEXT NOT NULL,
  body_md    TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (idea_id) REFERENCES idea(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_idea_note_idea ON idea_note(idea_id);

CREATE TABLE IF NOT EXISTS idea_link (
  id         TEXT PRIMARY KEY NOT NULL,
  idea_id    TEXT NOT NULL,
  kind       TEXT NOT NULL,              -- ref | tweet | video | doc | other
  url        TEXT NOT NULL,
  title      TEXT DEFAULT '',
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (idea_id) REFERENCES idea(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_idea_link_kind ON idea_link(idea_id, kind);

CREATE TABLE IF NOT EXISTS idea_attachment (
  id         TEXT PRIMARY KEY NOT NULL,
  idea_id    TEXT NOT NULL,
  filename   TEXT NOT NULL,
  path       TEXT NOT NULL,
  mime       TEXT DEFAULT '',
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (idea_id) REFERENCES idea(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_idea_attachment ON idea_attachment(idea_id);

-- FTS for ideas (title, summary)
CREATE VIRTUAL TABLE IF NOT EXISTS idea_fts
USING fts5(title, summary, content='idea', content_rowid='rowid');

CREATE TRIGGER IF NOT EXISTS idea_ai AFTER INSERT ON idea BEGIN
  INSERT INTO idea_fts(rowid, title, summary) VALUES (new.rowid, new.title, new.summary);
END;

CREATE TRIGGER IF NOT EXISTS idea_au AFTER UPDATE ON idea BEGIN
  INSERT INTO idea_fts(idea_fts, rowid, title, summary) VALUES('delete', old.rowid, old.title, old.summary);
  INSERT INTO idea_fts(rowid, title, summary) VALUES (new.rowid, new.title, new.summary);
END;

CREATE TRIGGER IF NOT EXISTS idea_ad AFTER DELETE ON idea BEGIN
  INSERT INTO idea_fts(idea_fts, rowid, title, summary) VALUES('delete', old.rowid, old.title, old.summary);
END;

CREATE TABLE IF NOT EXISTS idea_task_map (
  idea_id TEXT NOT NULL REFERENCES idea(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  PRIMARY KEY (idea_id, task_id)
);

----------------------------------------------------------------------
-- 5) Long-form Content (doc) + versions + tags
----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS doc (
  id           TEXT PRIMARY KEY NOT NULL,
  project_id   TEXT NOT NULL,                  -- keep project scoped like ideas
  title        TEXT NOT NULL,
  slug         TEXT UNIQUE,
  body_md      TEXT NOT NULL,
  body_html    TEXT NOT NULL,                  -- pre-render for fast loads
  cover_path   TEXT DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'draft',  -- draft | in_review | published
  created_at   TIMESTAMP NOT NULL,
  updated_at   TIMESTAMP NOT NULL,
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doc_project  ON doc(project_id);
CREATE INDEX IF NOT EXISTS idx_doc_status   ON doc(status);
CREATE INDEX IF NOT EXISTS idx_doc_updated  ON doc(updated_at);
CREATE INDEX IF NOT EXISTS idx_doc_slug     ON doc(slug);

CREATE TABLE IF NOT EXISTS doc_version (
  id         TEXT PRIMARY KEY NOT NULL,
  doc_id     TEXT NOT NULL,
  body_md    TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (doc_id) REFERENCES doc(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_doc_version_doc ON doc_version(doc_id);

CREATE TABLE IF NOT EXISTS doc_tag (
  doc_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (doc_id, tag_id),
  FOREIGN KEY (doc_id) REFERENCES doc(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS doc_attachment (
  id         TEXT PRIMARY KEY NOT NULL,
  doc_id     TEXT NOT NULL,
  filename   TEXT NOT NULL,
  path       TEXT NOT NULL,
  mime       TEXT DEFAULT '',
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (doc_id) REFERENCES doc(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_doc_attachment ON doc_attachment(doc_id);

-- FTS for docs (title and markdown body)
CREATE VIRTUAL TABLE IF NOT EXISTS doc_fts
USING fts5(title, body_md, content='doc', content_rowid='rowid');

CREATE TRIGGER IF NOT EXISTS doc_ai AFTER INSERT ON doc BEGIN
  INSERT INTO doc_fts(rowid, title, body_md) VALUES (new.rowid, new.title, new.body_md);
END;

CREATE TRIGGER IF NOT EXISTS doc_au AFTER UPDATE ON doc BEGIN
  INSERT INTO doc_fts(doc_fts, rowid, title, body_md) VALUES('delete', old.rowid, old.title, old.body_md);
  INSERT INTO doc_fts(rowid, title, body_md) VALUES (new.rowid, new.title, new.body_md);
END;

CREATE TRIGGER IF NOT EXISTS doc_ad AFTER DELETE ON doc BEGIN
  INSERT INTO doc_fts(doc_fts, rowid, title, body_md) VALUES('delete', old.rowid, old.title, old.body_md);
END;

----------------------------------------------------------------------
-- 6) Cross links: Ideas ↔ Docs
----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS idea_doc_map (
  idea_id TEXT NOT NULL,
  doc_id  TEXT NOT NULL,
  PRIMARY KEY (idea_id, doc_id),
  FOREIGN KEY (idea_id) REFERENCES idea(id) ON DELETE CASCADE,
  FOREIGN KEY (doc_id)  REFERENCES doc(id)  ON DELETE CASCADE
);

----------------------------------------------------------------------
-- 7) Convenience views
----------------------------------------------------------------------

-- Ideas with workspace and project names for quick listings
CREATE VIEW IF NOT EXISTS v_idea_enriched AS
SELECT
  i.id,
  i.title,
  i.summary,
  i.status,
  i.priority,
  i.effort_pts,
  i.impact_pts,
  i.created_at,
  i.updated_at,
  p.id   AS project_id,
  p.name AS project_name,
  w.id   AS workspace_id,
  w.name AS workspace_name
FROM idea i
JOIN project p   ON p.id = i.project_id
JOIN workspace w ON w.id = p.workspace_id;

-- Docs with workspace and project names
CREATE VIEW IF NOT EXISTS v_doc_enriched AS
SELECT
  d.id,
  d.title,
  d.slug,
  d.status,
  d.created_at,
  d.updated_at,
  p.id   AS project_id,
  p.name AS project_name,
  w.id   AS workspace_id,
  w.name AS workspace_name
FROM doc d
JOIN project p   ON p.id = d.project_id
JOIN workspace w ON w.id = p.workspace_id;


-- End of file
