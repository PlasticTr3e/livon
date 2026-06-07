import { Menu } from "lucide-react";

type AdminSidebarToggleProps = {
  onClick: () => void;
};

export function AdminSidebarToggle({ onClick }: AdminSidebarToggleProps) {
  return (
    <button
      type="button"
      className="-ml-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-white dark:hover:bg-slate-800 md:hidden"
      onClick={onClick}
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
