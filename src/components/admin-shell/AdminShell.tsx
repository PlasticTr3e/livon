"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import {
  fetchAdminNotifications,
  getUnreadAdminNotificationCount,
  type AdminNotification,
} from "@/lib/admin-shell/admin-notifications";
import { AdminHeader } from "./AdminHeader";
import { AdminMobileNavigation } from "./AdminMobileNavigation";
import { AdminSidebar } from "./AdminSidebar";

type AdminShellProps = {
  children: React.ReactNode;
};

const NOTIFICATION_POLL_INTERVAL_MS = 30000;

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole, userName } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isNotificationLoading, setIsNotificationLoading] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      try {
        setIsNotificationLoading(true);
        const nextNotifications = await fetchAdminNotifications();
        setNotifications(nextNotifications);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsNotificationLoading(false);
      }
    }

    loadNotifications();
    const interval = window.setInterval(
      loadNotifications,
      NOTIFICATION_POLL_INTERVAL_MS,
    );

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const notificationDiv = document.querySelector(
        "[data-notification-dropdown]",
      );
      if (notificationDiv && !notificationDiv.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }

    if (!isNotificationOpen) return;

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationOpen]);

  const unreadCount = useMemo(
    () => getUnreadAdminNotificationCount(notifications),
    [notifications],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 font-sans dark:bg-[#0B1120]">
      <AdminHeader
        isNotificationLoading={isNotificationLoading}
        isNotificationOpen={isNotificationOpen}
        notifications={notifications}
        pathname={pathname}
        theme={theme}
        unreadCount={unreadCount}
        userName={userName}
        userRole={userRole}
        onNotificationOpenChange={setIsNotificationOpen}
        onOpenNotifications={() => router.push("/notifications")}
        onOpenProfile={() => router.push("/profile")}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onToggleTheme={toggleTheme}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close admin navigation"
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <AdminSidebar
          isOpen={sidebarOpen}
          pathname={pathname}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50 pb-16 focus:outline-none dark:bg-[#0B1120] md:pb-0">
          {children}
        </main>
      </div>

      <AdminMobileNavigation pathname={pathname} />
    </div>
  );
}
