import { Moon, Sun } from "lucide-react";

type AdminThemeToggleProps = {
  theme: string;
  onToggle: () => void;
};

export function AdminThemeToggle({ theme, onToggle }: AdminThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-full p-2 text-gray-500 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
      title={theme === "dark" ? "Mode terang" : "Mode gelap"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-400" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
