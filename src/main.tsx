import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "../index.css";
import { Layout } from "./ui/Layout";
import { TasksList } from "./ui/tasks/TaskList";
import { TaskCreate } from "./ui/tasks/TaskCreate";
import { TaskShow } from "./ui/tasks/TaskShow";
import { ThemeProvider } from "@/components/theme-provider";


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
    <ThemeProvider defaultTheme="system">
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);