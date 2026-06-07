import { Activity, ChevronRight, LogOut, User } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import {
  getProfileDisplayName,
  getProfileRoleLabel,
} from "@/lib/profile/profile-user";
import type {
  ProfileRole,
  ProfileTab,
  UserWithProfile,
} from "@/lib/profile/profile-types";

type ProfileSidebarProps = {
  activeTab: ProfileTab;
  isOpen: boolean;
  user: UserWithProfile;
  userRole: ProfileRole;
  onTabChange: (tab: ProfileTab) => void;
  onLogout: () => void;
};

const profileNavigationItems = [
  {
    key: "personal" as const,
    label: "Personal Information",
    icon: User,
  },
  {
    key: "activity" as const,
    label: "Recent Activity",
    icon: Activity,
  },
];

export function ProfileSidebar({
  activeTab,
  isOpen,
  user,
  userRole,
  onTabChange,
  onLogout,
}: ProfileSidebarProps) {
  return (
    <aside
      className={cn(
        "absolute z-30 flex h-full w-72 flex-shrink-0 flex-col border-r border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-[#111827] md:relative md:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
    >
      <div className="flex flex-col items-center border-b border-gray-100 p-8 text-center dark:border-gray-800">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-300 bg-gradient-to-br from-green-100 to-emerald-200 dark:border-green-700 dark:from-green-900/40 dark:to-emerald-900/20">
          <User className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <p className="text-base font-bold leading-tight text-gray-900 dark:text-white">
          {getProfileDisplayName(user, userRole)}
        </p>
        <p className="mt-1 break-all text-xs text-gray-500 dark:text-white">
          {user.email}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400">
          {getProfileRoleLabel(userRole)}
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {profileNavigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onTabChange(item.key)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm"
                  : "text-gray-600 hover:bg-slate-100 hover:text-green-700 dark:text-white dark:hover:bg-slate-800 dark:hover:text-green-400",
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              <ChevronRight className="h-4 w-4 opacity-60" />
            </button>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4 dark:border-gray-800">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
        >
          <LogOut className="h-5 w-5" /> Logout
        </button>
      </div>
    </aside>
  );
}
