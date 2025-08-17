import { NavLink, useLocation } from "react-router-dom";
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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Home as HomeIcon, /*…*/ } from "lucide-react";


// icons (optional but recommended)
import {
  LayoutList,
  FileText,
  Lightbulb,
  PlusCircle,
  ChevronDown,
} from "lucide-react";

// primary nav
const NAV = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/tasks", label: "Tasks", icon: LayoutList },
  { to: "/ideas", label: "Ideas", icon: Lightbulb },
  { to: "/docs", label: "Docs", icon: FileText },
];

// create submenu
const CREATE = [
  { to: "/tasks/new", label: "New Task" },
  { to: "/ideas/new", label: "New Idea" },
  { to: "/docs/new", label: "New Doc" },
];

function LinkItem({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <SidebarMenuItem key={to}>
      <SidebarMenuButton asChild>
        <NavLink
          to={to}
          className={({ isActive }) =>
            cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm",
              isActive ? "bg-muted font-medium" : "hover:bg-muted/60"
            )
          }
          end
        >
          {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
          <span className="truncate">{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { pathname } = useLocation();

  // auto-open "Create" when a /new route is active
  const defaultOpen = pathname.endsWith("/new");

  return (
    <Sidebar className="border-r">
      <SidebarHeader>
        <div className="px-2 py-2 text-base font-semibold">Deep Focus</div>
      </SidebarHeader>

      <SidebarContent>
        {/* Primary navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Work</SidebarGroupLabel>
          <SidebarMenu>
            {NAV.map((item) => (
              <LinkItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Collapsible Create */}
        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>

          <Collapsible defaultOpen={defaultOpen} className="w-full">
            <SidebarMenu>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm",
                      "hover:bg-muted/60"
                    )}
                    aria-label="Toggle Create"
                  >
                    <div className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      <span>Create</span>
                    </div>
                    <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-1 data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
                  <SidebarMenu className="pl-6">
                    {CREATE.map((item, idx) => (
                      <SidebarMenuItem key={`${item.to}-${idx}`}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.to}
                            className={({ isActive }) =>
                              cn(
                                "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm",
                                isActive ? "bg-muted font-medium" : "hover:bg-muted/60"
                              )
                            }
                            end
                          >
                            <span className="truncate">{item.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarMenuItem>
            </SidebarMenu>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground">v0.1 • MIT</div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
