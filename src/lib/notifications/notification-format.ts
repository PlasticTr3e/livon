import type {
  DatabaseNotification,
  NotificationCategory,
  NotificationItem,
} from "./notification-types";

const categoryByNotificationType: Record<string, NotificationCategory> = {
  donation_success: "funding",
  project_status: "project",
  comment_reply: "comment",
  system: "system",
  new_registration: "registration",
  new_project: "project",
  new_news: "news",
};

const dotColorByCategory: Record<NotificationCategory, string> = {
  funding: "bg-yellow-400",
  project: "bg-green-500",
  comment: "bg-blue-400",
  system: "bg-purple-400",
  news: "bg-indigo-500",
  registration: "bg-orange-500",
};

const labelByCategory: Record<NotificationCategory, string> = {
  funding: "Crowdfunding",
  project: "Project",
  comment: "Comment",
  system: "System",
  news: "News",
  registration: "Registration",
};

export function transformNotification(
  notification: DatabaseNotification,
): NotificationItem {
  const category = getNotificationCategory(notification.type);

  return {
    id: notification.id,
    title: notification.title || "Notification",
    desc: notification.message || "",
    time: formatNotificationTime(new Date(notification.createdAt)),
    category,
    read: notification.isRead,
    dot: dotColorByCategory[category],
  };
}

export function getNotificationCategoryLabel(category: NotificationCategory) {
  return labelByCategory[category];
}

export function getUnreadNotificationsCount(notifications: NotificationItem[]) {
  return notifications.filter((notification) => !notification.read).length;
}

function getNotificationCategory(type?: string) {
  const notificationType = type?.toLowerCase() || "system";
  return categoryByNotificationType[notificationType] || "system";
}

function formatNotificationTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffMs / 604800000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;

  return date.toLocaleDateString("id-ID");
}
