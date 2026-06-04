"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  Map,
  Newspaper,
  Settings,
  Leaf,
  HandCoins,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import AdminLayout from "../(admin)/layout";
import { apiFetch } from "@/lib/api-client";

interface Notification {
  id: string;
  userId: string;
  projectId?: string;
  referenceId?: string;
  title?: string;
  type?: string;
  message?: string;
  isRead: boolean;
  createdAt: Date;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole, userName } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("livon-token");
        const response = await apiFetch<
          (Omit<Notification, "createdAt"> & { createdAt: string })[]
        >("/api/notifications", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.success && response.data) {
          const notifData: Notification[] = response.data.map((notif) => ({
            ...notif,
            createdAt: new Date(notif.createdAt),
          }));
          setNotifications(notifData);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    // Optionally set up polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const notificationDiv = document.querySelector(
        "[data-notification-dropdown]",
      );
      if (notificationDiv && !notificationDiv.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isNotificationOpen]);

  // Calculate unread count
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  // Format time to relative format
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return new Date(date).toLocaleDateString("id-ID");
  };

  const getDotColor = (type?: string) => {
    const categoryMap: Record<string, string> = {
      donation_success: "funding",
      project_status: "project",
      comment_reply: "comment",
      system: "system",
    };

    const dotColorMap: Record<string, string> = {
      funding: "bg-yellow-400",
      project: "bg-green-500",
      comment: "bg-blue-400",
      system: "bg-purple-400",
    };

    const notificationType = type?.toLowerCase() || "system";
    const category = categoryMap[notificationType] || "system";
    return dotColorMap[category] || "bg-purple-400";
  };

  // Jika route diawali /admin, pakai AdminLayout
  if (pathname.startsWith("/admin")) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  let navLinks;
  if (userRole === "agency") {
    navLinks = [
      { name: "Management", href: "/admin/dashboard", icon: Settings },
      { name: "Map & Projects", href: "/map", icon: Map },
      { name: "Crowdfunding", href: "/crowdfunding", icon: HandCoins },
      { name: "News", href: "/news", icon: Newspaper },
    ];
  } else {
    navLinks = [
      { name: "Map & Projects", href: "/map", icon: Map },
      { name: "Crowdfunding", href: "/crowdfunding", icon: HandCoins },
      { name: "News", href: "/news", icon: Newspaper },
    ];
  }

  const roleInitial = userName.charAt(0).toUpperCase();
  const displayRole = userRole;
  const roleGradient =
    userRole === "agency"
      ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
      : "bg-gradient-to-br from-green-500 to-green-700 text-white";

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans bg-slate-50 dark:bg-[#0B1120]">
      <header className="flex-none bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 h-16 px-4 flex items-center justify-between z-10 shadow-sm relative">
        <div className="flex items-center gap-2 md:gap-6">
          {/* Mobile Sidebar Toggle (Admin style) */}
          {(pathname === "/map" || pathname === "/profile") && (
            <button
              className="md:hidden p-2 -ml-2 text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              onClick={() =>
                window.dispatchEvent(new Event("toggle-app-sidebar"))
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}

          <Link
            href={userRole === "agency" ? "/admin/dashboard" : "/map"}
            className="flex items-center space-x-2 group shrink-0"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-green-300 dark:group-hover:shadow-green-900 transition-shadow">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black tracking-widest bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent">
              LIVON
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2",
                    isActive
                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm shadow-green-200 dark:shadow-green-900"
                      : "text-gray-500 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-green-700 dark:hover:text-green-400",
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={
              theme === "dark"
                ? "Beralih ke mode terang"
                : "Beralih ke mode gelap"
            }
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          <div className="relative" data-notification-dropdown>
            <button
              onClick={() => router.push("/notifications")}
              onMouseEnter={() => setIsNotificationOpen(true)}
              onMouseLeave={() => setIsNotificationOpen(false)}
              className="relative p-2 text-gray-500 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
              )}
            </button>
            {isNotificationOpen && (
              <div
                className="absolute right-0 mt-0 w-80 bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl z-50"
                onMouseLeave={() => setIsNotificationOpen(false)}
              >
                <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 rounded-t-xl flex items-center justify-between">
                  <p className="font-bold text-sm text-green-800 dark:text-green-300">
                    Notifikasi
                  </p>
                  <span className="w-5 h-5 rounded-full bg-green-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {loading ? (
                    <div className="p-3 text-center text-gray-500 dark:text-white text-sm">
                      Memuat notifikasi...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-3 text-center text-gray-500 dark:text-white text-sm">
                      Tidak ada notifikasi
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "p-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer flex gap-3",
                        )}
                      >
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                            getDotColor(n.type),
                            !n.isRead && "animate-pulse",
                          )}
                        />
                        <div className="flex-1">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              !n.isRead
                                ? "text-green-800 dark:text-green-200"
                                : "text-gray-800 dark:text-white",
                            )}
                          >
                            {n.title || "Notifikasi"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-white mt-0.5 leading-relaxed">
                            {n.message || ""}
                          </p>
                          <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 font-medium">
                            {formatTime(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            onClick={() => router.push("/profile")}
            className={cn(
              "flex items-center space-x-2 border-l border-gray-200 dark:border-gray-800 pl-3 ml-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors",
              pathname === "/profile" ? "bg-slate-100 dark:bg-[#1F2937]" : "",
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm",
                roleGradient,
              )}
            >
              {roleInitial}
            </div>
            <div className="hidden md:block text-sm">
              <p className="font-semibold text-gray-800 dark:text-white leading-tight">
                {userName}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {displayRole}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-col pb-16 md:pb-0">
        {children}
      </main>

      {/* ── Global Mobile Bottom Navigation ── */}
      <nav className="md:hidden fixed bottom-0 w-full h-16 bg-white dark:bg-[#111827] border-t border-gray-200 dark:border-gray-800 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-all duration-200",
                isActive
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400 dark:text-white hover:text-green-600 dark:hover:text-green-400",
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-full mb-0.5 transition-all",
                  isActive
                    ? "bg-green-50 dark:bg-green-900/30"
                    : "bg-transparent",
                )}
              >
                <link.icon
                  className={cn("w-5 h-5", isActive && "stroke-[2.5px]")}
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
    </div>
  );
}
