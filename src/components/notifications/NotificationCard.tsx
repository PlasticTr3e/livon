import { CheckCheck, Trash2 } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { getNotificationCategoryLabel } from "@/lib/notifications/notification-format";
import type { NotificationItem } from "@/lib/notifications/notification-types";

type NotificationCardProps = {
  notification: NotificationItem;
  onDelete: (notificationId: string) => void;
  onMarkAsRead: (notificationId: string) => void;
};

export function NotificationCard({
  notification,
  onDelete,
  onMarkAsRead,
}: NotificationCardProps) {
  return (
    <div
      className={cn(
        "group rounded-xl border bg-white p-4 transition-all hover:shadow-md dark:bg-[#111827]",
        notification.read
          ? "border-gray-200 dark:border-gray-800"
          : "border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-900/10",
      )}
    >
      <div className="flex gap-4">
        <div
          className={cn(
            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
            notification.dot,
            !notification.read && "animate-pulse",
          )}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {notification.title}
            </h3>
            <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-gray-400 dark:text-white">
              {notification.time}
            </span>
          </div>

          <p className="mb-2 text-xs leading-relaxed text-gray-600 dark:text-white">
            {notification.desc}
          </p>

          <div className="flex items-center justify-between">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-[#1F2937] dark:text-white">
              {getNotificationCategoryLabel(notification.category)}
            </span>

            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!notification.read && (
                <button
                  type="button"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                  title="Mark as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(notification.id)}
                className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
                title="Delete notification"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
