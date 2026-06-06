import { AdminBrandLink } from "./AdminBrandLink";
import { AdminDesktopNavigation } from "./AdminDesktopNavigation";
import { AdminNotificationMenu } from "./AdminNotificationMenu";
import { AdminSidebarToggle } from "./AdminSidebarToggle";
import { AdminThemeToggle } from "./AdminThemeToggle";
import { AdminUserProfileButton } from "./AdminUserProfileButton";
import type { AdminNotification } from "@/lib/admin-shell/admin-notifications";

type AdminHeaderProps = {
  isNotificationLoading: boolean;
  isNotificationOpen: boolean;
  notifications: AdminNotification[];
  pathname: string;
  theme: string;
  unreadCount: number;
  userName: string;
  userRole: string;
  onNotificationOpenChange: (isOpen: boolean) => void;
  onOpenProfile: () => void;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
};

export function AdminHeader({
  isNotificationLoading,
  isNotificationOpen,
  notifications,
  pathname,
  theme,
  unreadCount,
  userName,
  userRole,
  onNotificationOpenChange,
  onOpenProfile,
  onToggleSidebar,
  onToggleTheme,
}: AdminHeaderProps) {
  return (
    <header className="relative z-[2000] flex h-16 flex-none items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-800 dark:bg-[#111827]">
      <div className="flex items-center gap-2 md:gap-6">
        <AdminSidebarToggle onClick={onToggleSidebar} />
        <AdminBrandLink />
        <AdminDesktopNavigation pathname={pathname} />
      </div>

      <div className="flex items-center space-x-1">
        <AdminThemeToggle theme={theme} onToggle={onToggleTheme} />
        <AdminNotificationMenu
          isLoading={isNotificationLoading}
          isOpen={isNotificationOpen}
          notifications={notifications}
          unreadCount={unreadCount}
          onOpenChange={onNotificationOpenChange}
        />
        <AdminUserProfileButton
          isActive={pathname === "/profile"}
          role={userRole}
          userName={userName}
          onClick={onOpenProfile}
        />
      </div>
    </header>
  );
}
