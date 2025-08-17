// src/components/theme-provider.tsx
import { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";

type Theme = "light" | "dark" | "system";
type Ctx = { theme: Theme; setTheme: (t: Theme) => void };
const ThemeContext = createContext<Ctx | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = "system" }: PropsWithChildren<{ defaultTheme?: Theme }>) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || defaultTheme);

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    root.classList.toggle("dark", isDark);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
