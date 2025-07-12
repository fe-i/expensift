"use client";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ColorModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex justify-around gap-2">
      <Button
        variant={theme === "light" ? "default" : "outline"}
        size="icon"
        aria-label="Light mode"
        onClick={() => setTheme("light")}
      >
        <Sun />
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "outline"}
        size="icon"
        aria-label="Dark mode"
        onClick={() => setTheme("dark")}
      >
        <Moon />
      </Button>
      <Button
        variant={theme === "system" ? "default" : "outline"}
        size="icon"
        aria-label="System color mode"
        onClick={() => setTheme("system")}
      >
        <Monitor />
      </Button>
    </div>
  );
}
