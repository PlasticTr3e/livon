import { apiFetch } from "@/lib/api-client";
import { transformNotification } from "./notification-format";
import type {
  DatabaseNotification,
  NotificationItem,
} from "./notification-types";

export function getStoredNotificationToken() {
  return localStorage.getItem("livon-token");
}

export async function fetchUserNotifications(
  token: string | null,
): Promise<NotificationItem[]> {
  const response = await apiFetch<DatabaseNotification[]>(
    "/api/notifications",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.success || !response.data) return [];

  return response.data.map(transformNotification);
}

export async function markNotificationAsRead(
  notificationId: string,
  token: string | null,
) {
  return apiFetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isRead: true }),
  });
}
