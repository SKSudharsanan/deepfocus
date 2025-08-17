// src/components/theme-toggle.tsx
import { Button } from "@/components/ui/button";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light");
  };

const Icon =
    theme === "light" ? Sun :
    theme === "dark"  ? Moon :
    Laptop; // system

  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label="Toggle theme">
     <Icon className="h-4 w-4" />
    </Button>
  );
}
