import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const THEME_KEY = "clubhub.theme";

function applyTheme(dark: boolean) {
  const root = document.documentElement;
  root.classList.add("theme-changing");
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  window.setTimeout(() => root.classList.remove("theme-changing"), 250);
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setReady(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="group fixed right-3 top-3 z-[100] h-10 w-[72px] rounded-full border border-border/70 bg-card/90 p-1 text-card-foreground shadow-lg shadow-foreground/10 backdrop-blur-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="absolute inset-1 z-10 flex items-center justify-between px-1.5" aria-hidden="true">
        <Sun className={`size-4 transition-all ${dark ? "opacity-40" : "text-brand opacity-100"}`} />
        <Moon className={`size-4 transition-all ${dark ? "text-brand opacity-100" : "opacity-40"}`} />
      </span>
      <span
        aria-hidden="true"
        className={`relative block size-8 rounded-full bg-primary shadow-md ring-1 ring-primary-foreground/10 transition-transform duration-300 ease-out ${
          dark ? "translate-x-8" : "translate-x-0"
        } ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </button>
  );
}
