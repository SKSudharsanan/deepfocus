import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [taskMsg, setTaskMsg] = useState("");
  const [task, setTask] = useState("");

  async function invokeTask() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setTaskMsg(await invoke("invoke_task", { task }));
  }

  return (
    <main className="container">
      <h1>Welcome to DeepFocus</h1>

      <div className="row">
        <img src="/logo.png" className="logo vite" alt="Vite logo" />
      
      </div>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          invokeTask();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setTask(e.currentTarget.value)}
          placeholder="create your first task"
        />
        <button type="submit">Submit</button>
      </form>
      <p>{taskMsg}</p>
    </main>
  );
}

export default App;
