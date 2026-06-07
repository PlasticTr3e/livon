import { Moon, Sun } from "lucide-react";

type LoginThemeToggleProps = {
  theme: string;
  onToggle: () => void;
};

export function LoginThemeToggle({ theme, onToggle }: LoginThemeToggleProps) {
  const isDarkMode = theme === "dark";

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={onToggle}
      className="absolute right-6 top-6 rounded-full p-2 text-gray-400 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <Sun className="h-4 w-4 text-yellow-400" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
