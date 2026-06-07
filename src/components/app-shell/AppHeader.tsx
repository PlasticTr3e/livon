import type { AppNavLink } from "@/lib/app-shell/navigation";
import { AppBrandLink } from "./AppBrandLink";
import { AppDesktopNavigation } from "./AppDesktopNavigation";
import { AppNotificationMenu } from "./AppNotificationMenu";
import { AppSidebarToggle } from "./AppSidebarToggle";
import { AppThemeToggle } from "./AppThemeToggle";
import { AppUserProfileButton } from "./AppUserProfileButton";
import type { AppNotification } from "@/lib/app-shell/notifications";

type AppHeaderProps = {
  pathname: string;
  homeHref: string;
  navLinks: AppNavLink[];
  userName: string;
  userRole: string;
  theme: string;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  isNotificationLoading: boolean;
  isNotificationOpen: boolean;
  showSidebarToggle: boolean;
  onToggleTheme: () => void;
  onNotificationOpenChange: (isOpen: boolean) => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
};

export function AppHeader({
  pathname,
  homeHref,
  navLinks,
  userName,
  userRole,
  theme,
  notifications,
  unreadNotificationCount,
  isNotificationLoading,
  isNotificationOpen,
  showSidebarToggle,
  onToggleTheme,
  onNotificationOpenChange,
  onOpenNotifications,
  onOpenProfile,
}: AppHeaderProps) {
  return (
    <header className="relative z-[2147483645] flex h-16 flex-none items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-800 dark:bg-[#111827]">
      <div className="flex items-center gap-2 md:gap-6">
        {showSidebarToggle && <AppSidebarToggle />}
        <AppBrandLink href={homeHref} />
        <AppDesktopNavigation navLinks={navLinks} pathname={pathname} />
      </div>

      <div className="flex items-center space-x-1">
        <AppThemeToggle theme={theme} onToggle={onToggleTheme} />
        <AppNotificationMenu
          notifications={notifications}
          unreadCount={unreadNotificationCount}
          isLoading={isNotificationLoading}
          isOpen={isNotificationOpen}
          onOpenChange={onNotificationOpenChange}
          onNavigate={onOpenNotifications}
        />
        <AppUserProfileButton
          pathname={pathname}
          userName={userName}
          userRole={userRole}
          onClick={onOpenProfile}
        />
      </div>
    </header>
  );
}
