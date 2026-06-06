import { Bell } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import {
  formatNotificationTime,
  getNotificationDotColor,
  type AppNotification,
} from "@/lib/app-shell/notifications";

type AppNotificationMenuProps = {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onNavigate: () => void;
};

export function AppNotificationMenu({
  notifications,
  unreadCount,
  isLoading,
  isOpen,
  onOpenChange,
  onNavigate,
}: AppNotificationMenuProps) {
  return (
    <div className="relative z-[2100]" data-notification-dropdown>
      <button
        type="button"
        onClick={onNavigate}
        onMouseEnter={() => onOpenChange(true)}
        onMouseLeave={() => onOpenChange(false)}
        className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
        aria-label="Open notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full border-2 border-white bg-green-500 dark:border-slate-900" />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-[2200] mt-0 w-80 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-[#1F2937]"
          onMouseLeave={() => onOpenChange(false)}
        >
          <div className="flex items-center justify-between rounded-t-xl border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 p-3 dark:border-gray-800 dark:from-slate-800 dark:to-slate-800">
            <p className="text-sm font-bold text-green-800 dark:text-green-300">
              Notifikasi
            </p>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto">
            <NotificationMenuContent
              notifications={notifications}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationMenuContent({
  notifications,
  isLoading,
}: Pick<AppNotificationMenuProps, "notifications" | "isLoading">) {
  if (isLoading) {
    return (
      <div className="p-3 text-center text-sm text-gray-500 dark:text-white">
        Memuat notifikasi...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-3 text-center text-sm text-gray-500 dark:text-white">
        Tidak ada notifikasi
      </div>
    );
  }

  return notifications.map((notification) => (
    <div
      key={notification.id}
      className="flex cursor-pointer gap-3 border-b border-gray-100 p-3 transition-colors last:border-0 hover:bg-slate-50 dark:border-gray-800 dark:hover:bg-slate-700"
    >
      <div
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          getNotificationDotColor(notification.type),
          !notification.isRead && "animate-pulse",
        )}
      />
      <div className="flex-1">
        <p
          className={cn(
            "text-sm font-semibold",
            !notification.isRead
              ? "text-green-800 dark:text-green-200"
              : "text-gray-800 dark:text-white",
          )}
        >
          {notification.title || "Notifikasi"}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-white">
          {notification.message || ""}
        </p>
        <p className="mt-1 text-[10px] font-medium text-green-600 dark:text-green-400">
          {formatNotificationTime(notification.createdAt)}
        </p>
      </div>
    </div>
  ));
}
