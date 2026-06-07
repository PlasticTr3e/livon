import { Bell } from "lucide-react";
import { LoadingState } from "@/components/shared/LoadingState";
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
      <LoadingState
        label="Loading notifications..."
        variant="panel"
        className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#111827]"
      />
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
