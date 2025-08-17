import { invoke } from "@tauri-apps/api/core";

export async function createTaskFromIdea(payload: {
  idea_id: string;
  category: string;
  description?: string;
  start_at?: string;    // ISO
  end_est_at?: string;  // ISO
}): Promise<string> {
  return invoke("create_task_from_idea", { input: payload });
}

export async function saveDocAttachment(payload: {
  doc_id: string;
  filename: string;
  bytes_base64: string;
  mime?: string;
}): Promise<string> {
  return invoke("save_doc_attachment", payload);
}
