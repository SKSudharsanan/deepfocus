// UI/Layout.tsx
import { Outlet } from "react-router-dom";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"; // or relative path
import { AppSidebar } from "@/components/app-sidebar"; 
import { ThemeToggle } from "@/components/theme-toggle";
// adjust path

export function Layout() {
  return (
    <SidebarProvider>
      {/* Left side (collapsible) */}
      <AppSidebar />

      {/* Right side content column */}
      <SidebarInset className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-neutral-900 dark:to-neutral-950">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-white/70 backdrop-blur dark:bg-neutral-900/60 px-2 md:px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto" />
          <ThemeToggle />
        </header>

        {/* Routed pages */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
