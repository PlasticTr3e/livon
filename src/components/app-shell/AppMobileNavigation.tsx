import Link from "next/link";
import { cn } from "@/components/ui/primitives";
import type { AppNavLink } from "@/lib/app-shell/navigation";

type AppMobileNavigationProps = {
  navLinks: AppNavLink[];
  pathname: string;
};

export function AppMobileNavigation({
  navLinks,
  pathname,
}: AppMobileNavigationProps) {
  return (
    <nav className="fixed bottom-0 z-50 flex h-[calc(4rem+env(safe-area-inset-bottom))] w-full items-center justify-around border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:border-gray-800 dark:bg-[#111827] md:hidden">
      {navLinks.map((link) => {
        const isActive = pathname.startsWith(link.href);

        return (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "flex h-full w-full flex-col items-center justify-center transition-all duration-200",
              isActive
                ? "text-green-600 dark:text-green-400"
                : "text-gray-400 hover:text-green-600 dark:text-white dark:hover:text-green-400",
            )}
          >
            <div
              className={cn(
                "mb-0.5 rounded-full p-1 transition-all",
                isActive
                  ? "bg-green-50 dark:bg-green-900/30"
                  : "bg-transparent",
              )}
            >
              <link.icon
                className={cn("h-5 w-5", isActive && "stroke-[2.5px]")}
              />
            </div>
            <span
              className={cn(
                "text-[9px] font-semibold transition-all",
                isActive ? "scale-105" : "",
              )}
            >
              {link.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
