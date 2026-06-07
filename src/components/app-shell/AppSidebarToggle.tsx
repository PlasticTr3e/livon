import { Menu } from "lucide-react";

export function AppSidebarToggle() {
  return (
    <button
      type="button"
      className="-ml-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-white dark:hover:bg-slate-800 md:hidden"
      onClick={() => window.dispatchEvent(new Event("toggle-app-sidebar"))}
      aria-label="Toggle sidebar"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
