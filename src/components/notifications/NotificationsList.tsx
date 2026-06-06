import { Bell } from "lucide-react";
import type {
  NotificationFilter,
  NotificationItem,
} from "@/lib/notifications/notification-types";
import { NotificationCard } from "./NotificationCard";

type NotificationsListProps = {
  filter: NotificationFilter;
  isLoading: boolean;
  notifications: NotificationItem[];
  onDelete: (notificationId: string) => void;
  onMarkAsRead: (notificationId: string) => void;
};

export function NotificationsList({
  filter,
  isLoading,
  notifications,
  onDelete,
  onMarkAsRead,
}: NotificationsListProps) {
  if (isLoading) {
    return (
      <NotificationStateCard>
        <div className="flex items-center justify-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-green-600 dark:border-slate-600" />
          <p className="font-medium text-gray-500 dark:text-white">
            Loading notifications...
          </p>
        </div>
      </NotificationStateCard>
    );
  }

  if (notifications.length === 0) {
    return (
      <NotificationStateCard>
        <Bell className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-white" />
        <p className="font-medium text-gray-500 dark:text-white">
          {filter === "unread" ? "No unread notifications" : "No notifications"}
        </p>
      </NotificationStateCard>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onDelete={onDelete}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </div>
  );
}

function NotificationStateCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-[#111827]">
      {children}
    </div>
  );
}
