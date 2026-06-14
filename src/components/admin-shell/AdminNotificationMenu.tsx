import { Bell } from "lucide-react";
import { LoadingState } from "@/components/shared/LoadingState";
import { cn } from "@/components/ui/primitives";
import {
  formatAdminNotificationTime,
  type AdminNotification,
} from "@/lib/admin-shell/admin-notifications";

type AdminNotificationMenuProps = {
  isLoading: boolean;
  isOpen: boolean;
  notifications: AdminNotification[];
  unreadCount: number;
  onOpenChange: (isOpen: boolean) => void;
  onNavigate: () => void;
};

export function AdminNotificationMenu({
  isLoading,
  isOpen,
  notifications,
  unreadCount,
  onOpenChange,
  onNavigate,
}: AdminNotificationMenuProps) {
  const handleNotificationButtonClick = () => {
    onOpenChange(false);
    onNavigate();
  };

  const handleMouseEnter = () => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      onOpenChange(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      onOpenChange(false);
    }
  };

  return (
    <div
      className="relative z-[2100]"
      data-notification-dropdown
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleNotificationButtonClick}
        className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full border-2 border-white bg-green-500 dark:border-slate-900" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-[2200] mt-0 w-80 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-[#1F2937]">
          <div className="flex items-center justify-between rounded-t-xl border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 p-3 dark:border-gray-800 dark:from-slate-800 dark:to-slate-800">
            <p className="text-sm font-bold text-green-800 dark:text-green-300">
              Notifikasi
            </p>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <AdminNotificationLoadingState />
            ) : notifications.length === 0 ? (
              <AdminNotificationEmptyState label="Tidak ada notifikasi" />
            ) : (
              notifications.map((notification) => (
                <AdminNotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminNotificationLoadingState() {
  return (
    <div className="p-3 text-center text-sm text-gray-500 dark:text-white">
      <LoadingState label="Loading notifications..." variant="inline" />
    </div>
  );
}

function AdminNotificationEmptyState({ label }: { label: string }) {
  return (
    <div className="p-3 text-center text-sm text-gray-500 dark:text-white">
      {label}
    </div>
  );
}

function AdminNotificationItem({
  notification,
}: {
  notification: AdminNotification;
}) {
  return (
    <div
      className={cn(
        "flex cursor-pointer gap-3 border-b border-gray-100 p-3 transition-colors last:border-0 hover:bg-slate-50 dark:border-gray-800 dark:hover:bg-slate-700",
        !notification.isRead ? "bg-green-50 dark:bg-[#1F2937]" : "",
      )}
    >
      <div
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          !notification.isRead ? "bg-green-500" : "bg-gray-400",
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
          {formatAdminNotificationTime(notification.createdAt)}
        </p>
      </div>
    </div>
  );
}
