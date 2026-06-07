import Link from "next/link";
import { ChevronRight, Leaf } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import {
  adminSidebarLinks,
  isAdminSidebarLinkActive,
} from "@/lib/admin-shell/admin-navigation";

type AdminSidebarProps = {
  isOpen: boolean;
  pathname: string;
  onClose: () => void;
};

export function AdminSidebar({ isOpen, pathname, onClose }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "absolute z-30 flex h-full w-56 flex-shrink-0 flex-col border-r border-gray-200 bg-white shadow-lg transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-[#111827] md:relative md:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
    >
      <div className="flex shrink-0 items-center gap-2 bg-gradient-to-br from-green-600 to-green-800 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
          <Leaf className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-white">
            Admin Panel
          </p>
          <p className="text-[10px] text-green-200">LIVON Platform</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {adminSidebarLinks.map((link) => {
          const isActive = isAdminSidebarLinkActive(pathname, link);
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={onClose}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm"
                  : "text-gray-600 hover:bg-slate-100 hover:text-green-700 dark:text-white dark:hover:bg-slate-800 dark:hover:text-green-400",
              )}
            >
              <div className="flex items-center space-x-2.5">
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-green-600 dark:text-white dark:group-hover:text-green-400",
                  )}
                />
                <span>{link.name}</span>
              </div>
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-green-200" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
