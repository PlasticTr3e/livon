import Link from "next/link";
import { cn } from "@/components/ui/primitives";
import {
  adminTopNavigationLinks,
  isAdminTopNavigationActive,
} from "@/lib/admin-shell/admin-navigation";

type AdminDesktopNavigationProps = {
  pathname: string;
};

export function AdminDesktopNavigation({
  pathname,
}: AdminDesktopNavigationProps) {
  return (
    <nav className="hidden items-center space-x-1 md:flex">
      {adminTopNavigationLinks.map((link) => {
        const isActive = isAdminTopNavigationActive(pathname, link);
        const Icon = link.icon;

        return (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              isActive
                ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm shadow-green-200 dark:shadow-green-900"
                : "text-gray-500 hover:bg-slate-100 hover:text-green-700 dark:text-white dark:hover:bg-slate-800 dark:hover:text-green-400",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
