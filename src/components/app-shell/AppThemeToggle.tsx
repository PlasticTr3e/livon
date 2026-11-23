"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Moon, Sun } from "lucide-react";

type AppThemeToggleProps = {
  theme: string;
  onToggle: () => void;
};

export function AppThemeToggle({ theme, onToggle }: AppThemeToggleProps) {
  const { t: translateUi } = useLanguage();

  const isDarkMode = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-full p-2 text-gray-500 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
      title={
        isDarkMode
          ? translateUi("Beralih ke mode terang")
          : translateUi("Beralih ke mode gelap")
      }
      aria-label={
        isDarkMode
          ? translateUi("Beralih ke mode terang")
          : translateUi("Beralih ke mode gelap")
      }
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5 text-yellow-400" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
