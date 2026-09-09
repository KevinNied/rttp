"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { writeThemePreference } from "@/application/preferences/ui-preferences";

export function ThemeToggle({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  useEffect(() => {
    const light = document.documentElement.classList.contains("light");
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", light ? "#f5f7ff" : "#07080b");
  }, []);

  function toggleTheme() {
    const nextTheme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    const light = nextTheme === "light";
    document.documentElement.classList.toggle("dark", !light);
    document.documentElement.classList.toggle("light", light);
    document.documentElement.style.colorScheme = nextTheme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", light ? "#f5f7ff" : "#07080b");
    writeThemePreference(nextTheme);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon-sm" : "sm"}
      aria-label="Cambiar tema"
      title="Cambiar tema"
      onClick={toggleTheme}
      className={cn(
        "rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/55 hover:bg-white/[0.08] hover:text-white",
        !compact && "w-full justify-between px-3 text-xs",
        className,
      )}
    >
      {!compact && <span>Cambiar tema</span>}
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </Button>
  );
}
