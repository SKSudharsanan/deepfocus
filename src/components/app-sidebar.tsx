// components/app-sidebar.tsx
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"; // or "../components/ui/sidebar"
import { cn } from "@/lib/utils"; // or your utils path

// Simple menu model
const primary = [
  { to: "/tasks", label: "Tasks" },
  { to: "/tasks/new", label: "New Task" },
];

const more = [
  { to: "#", label: "Ideas" },
  { to: "#", label: "Reads" },
  { to: "#", label: "Watchlist" },
  { to: "#", label: "Goals" },
  { to: "#", label: "Investments" },
  { to: "#", label: "Feeds" },
  { to: "#", label: "Reports" },
  { to: "#", label: "Settings" },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r">
      <SidebarHeader>
        <div className="px-2 py-2 text-base font-semibold">Deep Focus</div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Work</SidebarGroupLabel>
          <SidebarMenu>
            {primary.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm",
                        isActive ? "bg-muted font-medium" : "hover:bg-muted/60"
                      )
                    }
                  >
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>More</SidebarGroupLabel>
          <SidebarMenu>
            {more.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm",
                        isActive ? "bg-muted font-medium" : "hover:bg-muted/60"
                      )
                    }
                  >
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground">v0.1 • MIT</div>
      </SidebarFooter>

      <SidebarRail /> {/* collapsible rail handle (desktop) */}
    </Sidebar>
  );
}
