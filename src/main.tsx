import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "../index.css";
import { Layout } from "./ui/Layout";
import { ThemeProvider } from "@/components/theme-provider";

import { Home } from "./ui/Home";

// TASKS
import { TasksList } from "./ui/tasks/TaskList";
import { TaskCreate } from "./ui/tasks/TaskCreate";
import { TaskShow } from "./ui/tasks/TaskShow";

// IDEAS
import { IdeasList } from "./ui/ideas/IdeasList";
import { IdeaCreate } from "./ui/ideas/IdeaCreate";
import { IdeaShow } from "./ui/ideas/IdeaShow";

// DOCS
import { DocsList } from "./ui/docs/DocsList";
import { DocCreate } from "./ui/docs/DocCreate";
import { DocEditor } from "./ui/docs/DocEditor";
import { DocView } from "./ui/docs/DocView";


const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      // default landing
     { index: true, element: <Home /> }, 

      // tasks
      { path: "tasks", element: <TasksList /> },
      { path: "tasks/new", element: <TaskCreate /> },
      { path: "tasks/:id", element: <TaskShow /> },

      // ideas
      { path: "ideas", element: <IdeasList /> },
      { path: "ideas/new", element: <IdeaCreate /> },
      { path: "ideas/:id", element: <IdeaShow /> },

      // docs
      { path: "docs", element: <DocsList /> },
      { path: "docs/new", element: <DocCreate /> },
      { path: "docs/:id", element: <DocView /> }, 
      { path: "docs/:id/edit", element: <DocEditor /> },
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
