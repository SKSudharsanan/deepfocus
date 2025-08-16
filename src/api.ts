import { invoke } from "@tauri-apps/api/core";
import type { TaskDetail, TaskInput, TaskRow, TaskStatus } from "./types";

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
};
