"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/components/ui/WireframePrimitives";
import {
  BarChart2,
  FolderKanban,
  MessageSquare,
  Newspaper,
  Users,
  DollarSign,
  ChevronRight,
  Leaf,
  Bell,
  Map,
  Settings,
  Sun,
  Moon,
  HandCoins,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        const response = await apiFetch<{ data: Notification[] }>(
          "/api/notifications",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.success && response.data?.data) {
          const notifData: Notification[] = response.data.data.map(
            (notif: unknown) => {
              const n = notif as Omit<Notification, "createdAt"> & {
                createdAt: string;
              };
              return {
                ...n,
                createdAt: new Date(n.createdAt),
              };
            },
          );
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

  const sidebarLinks = [
    { name: "Dashboard", href: "/admin/dashboard", icon: BarChart2 },
    { name: "Projects", href: "/admin/projects", icon: FolderKanban },
    { name: "Crowdfunding", href: "/admin/crowdfunding", icon: DollarSign },
    { name: "Comments", href: "/admin/comments", icon: MessageSquare },
    { name: "News", href: "/admin/news", icon: Newspaper },
    { name: "Users", href: "/admin/users", icon: Users },
  ];

  // Management FIRST in top nav
  const navLinks = [
    {
      name: "Management",
      href: "/admin/dashboard",
      icon: Settings,
      matchPrefix: "/admin",
    },
    { name: "Map", href: "/map", icon: Map, matchPrefix: "/map" },
    {
      name: "Crowdfunding",
      href: "/crowdfunding",
      icon: HandCoins,
      matchPrefix: "/crowdfunding",
    },
    { name: "News", href: "/news", icon: Newspaper, matchPrefix: "/news" },
  ];

  const roleInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans bg-slate-50 dark:bg-slate-950">
      {/* ── Top Navbar ── */}
      <header className="flex-none bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 h-16 px-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-2 group shrink-0"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-green-300 dark:group-hover:shadow-green-900 transition-shadow">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black tracking-widest bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent">
              LIVON
            </span>
          </Link>

          {/* Nav links — Management first */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive =
                link.name === "Management"
                  ? pathname.startsWith("/admin")
                  : pathname.startsWith(link.matchPrefix);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2",
                    isActive
                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm shadow-green-200 dark:shadow-green-900"
                      : "text-gray-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-green-700 dark:hover:text-green-400",
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-1">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Bell */}
          <div className="relative" data-notification-dropdown>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              onMouseEnter={() => setIsNotificationOpen(true)}
              className="relative p-2 text-gray-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
              )}
            </button>
            {isNotificationOpen && (
              <div
                className="absolute right-0 mt-0 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-xl z-50"
                onMouseLeave={() => setIsNotificationOpen(false)}
              >
                <div className="p-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 rounded-t-xl flex items-center justify-between">
                  <p className="font-bold text-sm text-green-800 dark:text-green-300">
                    Notifikasi
                  </p>
                  <span className="w-5 h-5 rounded-full bg-green-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {loading ? (
                    <div className="p-3 text-center text-gray-500 dark:text-slate-400 text-sm">
                      Memuat notifikasi...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-3 text-center text-gray-500 dark:text-slate-400 text-sm">
                      Tidak ada notifikasi
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "p-3 border-b border-gray-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer flex gap-3",
                          !n.isRead ? "bg-green-50 dark:bg-slate-800" : "",
                        )}
                      >
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                            !n.isRead ? "bg-green-500" : "bg-gray-400",
                          )}
                        />
                        <div className="flex-1">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              !n.isRead
                                ? "text-green-800 dark:text-green-200"
                                : "text-gray-800 dark:text-slate-200",
                            )}
                          >
                            {n.title || "Notifikasi"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">
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

          {/* Profile */}
          <div
            onClick={() => router.push("/profile")}
            className={cn(
              "flex items-center space-x-2 border-l border-gray-200 dark:border-slate-700 pl-3 ml-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors",
              pathname === "/profile" ? "bg-slate-100 dark:bg-slate-800" : "",
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-sm font-bold shadow-sm text-yellow-900">
              {roleInitial}
            </div>
            <div className="hidden md:block text-sm">
              <p className="font-semibold text-gray-800 dark:text-slate-200 leading-tight">
                {userName}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {userRole}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Body: Sidebar + Content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Admin Sidebar */}
        <aside className="w-56 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex-shrink-0 flex flex-col shadow-sm z-20">
          {/* Sidebar header */}
          <div className="px-4 py-4 bg-gradient-to-br from-green-600 to-green-800 flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-white tracking-widest uppercase">
                Admin Panel
              </p>
              <p className="text-[10px] text-green-200">LIVON Platform</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {sidebarLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/admin/dashboard" &&
                  pathname.startsWith(link.href + "/")) ||
                (link.href === "/admin/projects" &&
                  pathname.startsWith("/admin/projects"));

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                    isActive
                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm"
                      : "text-gray-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-green-700 dark:hover:text-green-400",
                  )}
                >
                  <div className="flex items-center space-x-2.5">
                    <link.icon
                      className={cn(
                        "flex-shrink-0 h-4 w-4",
                        isActive
                          ? "text-white"
                          : "text-gray-400 dark:text-slate-500 group-hover:text-green-600 dark:group-hover:text-green-400",
                      )}
                    />
                    <span>{link.name}</span>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-green-200" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-200 dark:border-slate-700">
            <div className="px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 rounded-lg border border-green-100 dark:border-slate-700">
              <p className="text-xs text-green-700 dark:text-green-400 font-semibold">
                LIVON Admin v1.0
              </p>
              <p className="text-[10px] text-green-500 dark:text-green-500 mt-0.5">
                Civic Platform
              </p>
            </div>
          </div>
        </aside>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto focus:outline-none bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
