import Link from "next/link";
import { cn } from "@/components/ui/primitives";
import type { AppNavLink } from "@/lib/app-shell/navigation";

type AppDesktopNavigationProps = {
  navLinks: AppNavLink[];
  pathname: string;
};

export function AppDesktopNavigation({
  navLinks,
  pathname,
}: AppDesktopNavigationProps) {
  return (
    <nav className="hidden items-center space-x-1 md:flex">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;

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
            <link.icon className="h-4 w-4" />
            <span>{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
