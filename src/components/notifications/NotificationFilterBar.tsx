import { Filter } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import type { NotificationFilter } from "@/lib/notifications/notification-types";

type NotificationFilterBarProps = {
  activeFilter: NotificationFilter;
  notificationsCount: number;
  unreadCount: number;
  onFilterChange: (filter: NotificationFilter) => void;
};

const filterOptions = [
  { key: "all" as const, label: "All" },
  { key: "unread" as const, label: "Unread" },
];

export function NotificationFilterBar({
  activeFilter,
  notificationsCount,
  unreadCount,
  onFilterChange,
}: NotificationFilterBarProps) {
  const counts: Record<NotificationFilter, number> = {
    all: notificationsCount,
    unread: unreadCount,
  };

  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#111827]">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500 dark:text-white" />
        {filterOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onFilterChange(option.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold transition-all",
              activeFilter === option.key
                ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm"
                : "text-gray-600 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800",
            )}
          >
            {option.label} {counts[option.key] > 0 && `(${counts[option.key]})`}
          </button>
        ))}
      </div>
    </div>
  );
}
