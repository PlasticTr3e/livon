import { apiFetch } from "@/lib/api-client";

export type AdminNotification = {
  id: string;
  userId: string;
  projectId?: string;
  referenceId?: string;
  title?: string;
  type?: string;
  message?: string;
  isRead: boolean;
  createdAt: Date;
};

type ApiAdminNotification = Omit<AdminNotification, "createdAt"> & {
  createdAt: string;
};

export async function fetchAdminNotifications() {
  const token = localStorage.getItem("livon-token");
  const response = await apiFetch<{ data: ApiAdminNotification[] }>(
    "/api/notifications",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.success || !response.data?.data) return [];

  return response.data.data.map((notification) => ({
    ...notification,
    createdAt: new Date(notification.createdAt),
  }));
}

export function getUnreadAdminNotificationCount(
  notifications: AdminNotification[],
) {
  return notifications.filter((notification) => !notification.isRead).length;
}

export function formatAdminNotificationTime(date: Date) {
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
}
