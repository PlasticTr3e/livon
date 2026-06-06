"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import {
  canToggleRouteSidebar,
  getAppNavLinks,
  getHomeHref,
} from "@/lib/app-shell/navigation";
import {
  getUnreadNotificationCount,
  normalizeNotifications,
  type ApiNotification,
  type AppNotification,
} from "@/lib/app-shell/notifications";
import { AppHeader } from "./AppHeader";
import { AppMobileNavigation } from "./AppMobileNavigation";

type AppShellProps = {
  children: React.ReactNode;
};

const NOTIFICATION_POLL_INTERVAL_MS = 30000;

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole, userName } = useUser();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationLoading, setIsNotificationLoading] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setIsNotificationLoading(true);
        const token = localStorage.getItem("livon-token");
        const response = await apiFetch<ApiNotification[]>(
          "/api/notifications",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.success && response.data) {
          setNotifications(normalizeNotifications(response.data));
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsNotificationLoading(false);
      }
    }

    fetchNotifications();
    const interval = window.setInterval(
      fetchNotifications,
      NOTIFICATION_POLL_INTERVAL_MS,
    );

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isNotificationOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const dropdown = document.querySelector("[data-notification-dropdown]");
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationOpen]);

  const navLinks = useMemo(() => getAppNavLinks(userRole), [userRole]);
  const unreadNotificationCount = useMemo(
    () => getUnreadNotificationCount(notifications),
    [notifications],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 font-sans dark:bg-[#0B1120]">
      <AppHeader
        pathname={pathname}
        homeHref={getHomeHref(userRole)}
        navLinks={navLinks}
        userName={userName}
        userRole={userRole}
        theme={theme}
        notifications={notifications}
        unreadNotificationCount={unreadNotificationCount}
        isNotificationLoading={isNotificationLoading}
        isNotificationOpen={isNotificationOpen}
        showSidebarToggle={canToggleRouteSidebar(pathname)}
        onToggleTheme={toggleTheme}
        onNotificationOpenChange={setIsNotificationOpen}
        onOpenNotifications={() => router.push("/notifications")}
        onOpenProfile={() => router.push("/profile")}
      />

      <main className="relative flex flex-1 flex-col overflow-hidden pb-16 md:pb-0">
        {children}
      </main>

      <AppMobileNavigation navLinks={navLinks} pathname={pathname} />
    </div>
  );
}
