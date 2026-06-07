export type AppNotification = {
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

export type ApiNotification = Omit<AppNotification, "createdAt"> & {
  createdAt: string;
};

const notificationCategoryByType: Record<string, string> = {
  donation_success: "funding",
  project_status: "project",
  comment_reply: "comment",
  system: "system",
};

const notificationDotColorByCategory: Record<string, string> = {
  funding: "bg-yellow-400",
  project: "bg-green-500",
  comment: "bg-blue-400",
  system: "bg-purple-400",
};

export function normalizeNotifications(notifications: ApiNotification[]) {
  return notifications.map((notification) => ({
    ...notification,
    createdAt: new Date(notification.createdAt),
  }));
}

export function getUnreadNotificationCount(
  notifications: Pick<AppNotification, "isRead">[],
) {
  return notifications.filter((notification) => !notification.isRead).length;
}

export function getNotificationDotColor(type?: string) {
  const notificationType = type?.toLowerCase() || "system";
  const category = notificationCategoryByType[notificationType] || "system";
  return notificationDotColorByCategory[category] || "bg-purple-400";
}

export function formatNotificationTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return date.toLocaleDateString("id-ID");
}
