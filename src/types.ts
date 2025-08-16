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