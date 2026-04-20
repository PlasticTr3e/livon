"use client";
import { useState, useEffect } from "react";
import { Bell, CheckCheck, Trash2, Filter } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface DatabaseNotification {
  id: string;
  userId: string;
  projectId?: string;
  referenceId?: string;
  title?: string;
  type?: string;
  message?: string;
  isRead: boolean;
  createdAt: string | Date;
}

type Notification = {
  id: string;
  title: string;
  desc: string;
  time: string;
  category: "funding" | "project" | "comment" | "system";
  read: boolean;
  dot: string;
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from database
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("livon-token");
        const response = await apiFetch<DatabaseNotification[]>(
          "/api/notifications",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.success && response.data) {
          const transformedNotifications = response.data.map((notif) => {
            const categoryMap: Record<
              string,
              "funding" | "project" | "comment" | "system"
            > = {
              funding: "funding",
              project: "project",
              comment: "comment",
              system: "system",
            };

            const dotColorMap: Record<string, string> = {
              funding: "bg-yellow-400",
              project: "bg-green-500",
              comment: "bg-blue-400",
              system: "bg-purple-400",
            };

            const notificationType = notif.type?.toLowerCase() || "system";
            const category = categoryMap[notificationType] || "system";
            const dotColor = dotColorMap[notificationType] || "bg-purple-400";

            return {
              id: notif.id,
              title: notif.title || "Notifikasi",
              desc: notif.message || "",
              time: formatTime(new Date(notif.createdAt)),
              category,
              read: notif.isRead,
              dot: dotColor,
            };
          });

          setNotifications(transformedNotifications);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Format time to relative format
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);

    if (diffMins < 1) return "baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffWeeks < 4) return `${diffWeeks} minggu lalu`;
    return new Date(date).toLocaleDateString("id-ID");
  };

  const filteredNotifications =
    filter === "all" ? notifications : notifications.filter((n) => !n.read);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      // Update local state optimistically
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );

      // Call API to update in database
      const token = localStorage.getItem("livon-token");
      await apiFetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isRead: true }),
      });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Update local state optimistically
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

      // Call API to update all in database (if endpoint exists)
      // await apiFetch("/api/notifications/mark-all-as-read", {
      //   method: "POST",
      // });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Update local state optimistically
      setNotifications((prev) => prev.filter((n) => n.id !== id));

      // Call API to delete from database (if endpoint exists)
      // await apiFetch(`/api/notifications/${id}`, {
      //   method: "DELETE",
      // });
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      funding: "Crowdfunding",
      project: "Proyek",
      comment: "Komentar",
      system: "Sistem",
    };
    return labels[category] || category;
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-md">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100">
              Notifikasi
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 ml-[52px]">
            Pantau semua aktivitas dan pembaruan proyek komunitas
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 mb-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-slate-400" />
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filter === "all"
                  ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm"
                  : "text-gray-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Semua {notifications.length > 0 && `(${notifications.length})`}
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filter === "unread"
                  ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm"
                  : "text-gray-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Belum Dibaca {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-12 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-gray-300 dark:border-slate-600 border-t-green-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 dark:text-slate-400 font-medium">
                Memuat notifikasi...
              </p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-12 text-center shadow-sm">
            <Bell className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-slate-400 font-medium">
              {filter === "unread"
                ? "Tidak ada notifikasi yang belum dibaca"
                : "Tidak ada notifikasi"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-4 transition-all hover:shadow-md group ${
                  n.read
                    ? "border-gray-200 dark:border-slate-700"
                    : "border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10"
                }`}
              >
                <div className="flex gap-4">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.dot} ${!n.read && "animate-pulse"}`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                        {n.title}
                      </h3>
                      <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                        {n.time}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed mb-2">
                      {n.desc}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-medium">
                        {getCategoryLabel(n.category)}
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.read && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            title="Tandai sudah dibaca"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Hapus notifikasi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
