import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export type ThemeMode = "dark" | "light";

export function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("wm-theme");
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  }
  localStorage.setItem("wm-theme", theme);
  window.dispatchEvent(new CustomEvent("wm-theme-change", { detail: theme }));
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<ThemeMode>;
      if (custom.detail) {
        setTheme(custom.detail);
      }
    };
    window.addEventListener("wm-theme-change", handler);
    return () => window.removeEventListener("wm-theme-change", handler);
  }, []);

  const toggle = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Dark/Light Theme"
      className={`inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] hover:border-[#84cc16]/50 px-3 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm ${className}`}
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-3.5 h-3.5 text-[#a3e635]" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-[#65a30d]" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
}

export default ThemeToggle;
