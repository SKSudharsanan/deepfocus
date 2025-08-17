import { invoke } from "@tauri-apps/api/core";
import type { TaskDetail, TaskInput, TaskRow, TaskStatus,  IdeaDetail,
  IdeaRow,
  IdeaStatus,
  DocDetail,
  DocRow, ProjectOption, WorkspaceOption } from "./types";

export const api = {
  async listTasks(): Promise<TaskRow[]> {
    const rows = await invoke<TaskRow[]>("list_tasks");
    return rows;
  },
  async getTask(id: string): Promise<TaskDetail> {
    return invoke<TaskDetail>("get_task", { id });
  },
  async addTask(input: TaskInput): Promise<string> {
    return invoke<string>("add_task", { input });
  },
  async updateTask(input: Partial<TaskInput> & { id: string }): Promise<void> {
    return invoke("update_task", { input });
  },
  async setTaskStatus(id: string, status: TaskStatus): Promise<void> {
    return invoke("set_task_status", { id, status });
  },
  async addReason(taskId: string, status: TaskStatus, note: string): Promise<void> {
    return invoke("add_reason", { input: { taskId, status, note } });
  },
  // ========= IDEAS =========
  async listIdeas(projectId: string): Promise<IdeaRow[]> {
    return invoke<IdeaRow[]>("list_ideas", { projectId });
  },
  async getIdea(id: string): Promise<IdeaDetail> {
    return invoke<IdeaDetail>("get_idea", { id });
  },
  async addIdea(input: {
    project_id: string;
    title: string;
    summary?: string;
    status?: IdeaStatus | string; // "inbox" etc.
    priority?: number;            // 0..4
    effort_pts?: number;
    impact_pts?: number;
  }): Promise<string> {
    return invoke<string>("add_idea", { input });
  },
  async updateIdea(input: {
    id: string;
    title?: string;
    summary?: string | null;
    status?: IdeaStatus | string;
    priority?: number;
    effort_pts?: number;
    impact_pts?: number;
  }): Promise<void> {
    return invoke("update_idea", { input });
  },
  async addIdeaNote(idea_id: string, body_md: string): Promise<string> {
    return invoke<string>("add_idea_note", { input: { idea_id, body_md } });
  },
  async addIdeaLink(p: {
    idea_id: string;
    kind: "ref" | "tweet" | "video" | "doc" | "other";
    url: string;
    title?: string;
  }): Promise<string> {
    return invoke<string>("add_idea_link", { input: p });
  },
  async addIdeaAttachment(p: {
    idea_id: string;
    filename: string;
    path: string;     // absolute file path already copied to your app dir
    mime?: string;
  }): Promise<string> {
    return invoke<string>("add_idea_attachment", { input: p });
  },
  async linkIdeaDoc(idea_id: string, doc_id: string): Promise<void> {
    return invoke("link_idea_doc", { input: { idea_id, doc_id } });
  },
  async searchIdeas(q: string, project_id?: string): Promise<[string, string][]> {
     return invoke<[string, string][]>('search_ideas', { q, projectId: project_id });
  },
  async createTaskFromIdea(p: {
    idea_id: string;
    category: string;
    description?: string;
    start_at?: string;   // ISO
    end_est_at?: string; // ISO
  }): Promise<string> {
    return invoke<string>("create_task_from_idea", { input: p });
  },

  // ========= DOCS =========
  async listDocs(projectId: string): Promise<DocRow[]> {
    return invoke<DocRow[]>("list_docs", { projectId });
  },
  async getDoc(id: string): Promise<DocDetail> {
    return invoke<DocDetail>("get_doc", { id });
  },
  async addDoc(p: {
    project_id: string;
    title: string;
    slug?: string;
    body_md: string;
    cover_path?: string;
    status?: "draft" | "in_review" | "published" | string;
  }): Promise<string> {
    return invoke<string>("add_doc", { input: p });
  },
  async updateDocBody(id: string, body_md: string): Promise<void> {
    return invoke("update_doc_body", { input: { id, body_md } });
  },
  async updateDocMeta(p: {
    id: string;
    title?: string;
    slug?: string;
    cover_path?: string;
    status?: "draft" | "in_review" | "published" | string;
  }): Promise<void> {
    return invoke("update_doc_meta", { input: p });
  },
  async searchDocs(q: string, project_id?: string): Promise<[string, string][]> {
   return invoke<[string, string][]>('search_docs', { q, projectId: project_id });
  },
  async saveDocAttachment(p: {
    doc_id: string;
    filename: string;
    bytes_base64: string;
    mime?: string;
  }): Promise<string> {
    return invoke<string>("save_doc_attachment", p);
  },
  async  listWorkspaces(): Promise<WorkspaceOption[]> {
  return invoke<WorkspaceOption[]>("list_workspaces");
},
async createWorkspace(input: { name: string; kind?: string }): Promise<string> {
  return invoke<string>("create_workspace", { input });
},
  async listProjects(workspaceId?: string): Promise<ProjectOption[]> {
  // expects a Tauri command `list_projects` that returns:
  // [{ id, name, workspace_id, workspace_name }]
 return invoke<ProjectOption[]>("list_projects", { workspaceId });
},
async createProject(input: {
  workspace_id: string;
  name: string;
  description?: string;
  status?: "active" | "paused" | "archived" | string;
}): Promise<string> {
  return invoke<string>("create_project", { input });
},
async countTasks(projectId: string): Promise<number> {
  return invoke<number>("count_tasks_by_project", { projectId });
},
async countIdeas(projectId: string): Promise<number> {
  return invoke<number>("count_ideas_by_project", { projectId });
},
async countDocs(projectId: string): Promise<number> {
  return invoke<number>("count_docs_by_project", { projectId });
}

};
