"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Theme Toggle"
      className="inline-flex size-6 cursor-pointer items-center justify-center rounded-lg border border-foreground/20 bg-foreground/5 shadow-sm select-none dark:bg-foreground/15"
    >
      <SunIcon
        size={16}
        className="hidden fill-yellow-600 text-yellow-500 dark:block"
      />
      <MoonIcon
        size={16}
        className="block fill-purple-700 text-purple-800 dark:hidden"
      />
    </button>
  );
}
