import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./styles.css";
import { Layout } from "./ui/Layout";
import { TasksList } from "./ui/tasks/TaskList";
import { TaskCreate } from "./ui/tasks/TaskCreate";
import { TaskShow } from "./ui/tasks/TaskShow";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <TasksList /> },
      { path: "tasks", element: <TasksList /> },
      { path: "tasks/new", element: <TaskCreate /> },
      { path: "tasks/:id", element: <TaskShow /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);