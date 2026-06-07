import { Bell } from "lucide-react";

export function NotificationsHeader() {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-md">
          <Bell className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          Notifications
        </h1>
      </div>
      <p className="ml-[52px] text-sm text-gray-500 dark:text-white">
        Monitor all community project activities and updates
      </p>
    </div>
  );
}
