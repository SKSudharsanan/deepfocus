export type TaskStatus =
  | "todo"
  | "started"
  | "in-progress"
  | "stage-complete"
  | "completed"
  | "dropped";

export type TaskRow = {
  id: string;
  name: string;
  category: string;
  status: TaskStatus;
  current_stage?: string | null;
  start_at?: string | null; // ISO
  end_est_at?: string | null; // ISO
  updated_at: string; // ISO
};

export type TaskDetail = {
  id: string;
  name: string;
  category: string;
  short_summary?: string | null;
  description?: string | null;
  status: TaskStatus;
  current_stage?: string | null;
  start_at?: string | null;
  end_est_at?: string | null;
  created_at: string; // ISO
  updated_at: string; // ISO
};

export type TaskInput = {
  name: string;
  category: string;
  short_summary?: string;
  description?: string;
  status: TaskStatus;
  current_stage?: string;
  start_at?: string | null;
  end_est_at?: string | null;
};

export type IdeaStatus =
  | "inbox"
  | "exploring"
  | "building"
  | "paused"
  | "shipped"
  | "dropped";

export type IdeaRow = {
  id: string;
  project_id: string;
  title: string;
  status: IdeaStatus | string;
  priority: number;
  updated_at: string;
};

export type IdeaDetail = {
  id: string;
  project_id: string;
  title: string;
  summary?: string | null;
  status: IdeaStatus | string;
  priority: number;
  effort_pts: number;
  impact_pts: number;
  created_at: string;
  updated_at: string;
};

export type DocRow = {
  id: string;
  project_id: string;
  title: string;
  slug?: string | null;
  status: "draft" | "in_review" | "published" | string;
  updated_at: string;
};

export type DocDetail = {
  id: string;
  project_id: string;
  title: string;
  slug?: string | null;
  body_md: string;
  body_html: string;
  cover_path?: string | null;
  status: "draft" | "in_review" | "published" | string;
  created_at: string;
  updated_at: string;
};

export type ProjectOption = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  workspace_id: string;
  workspace_name: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceOption = {
  id: string;
  name: string;
  kind: "personal" | "work" | "custom" | string;
  created_at: string;
  updated_at: string;
};