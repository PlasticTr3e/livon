"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";
import { canManageProjects } from "@/lib/permissions";
import { ADMIN_DASHBOARD_ACTIONS } from "@/lib/admin-dashboard/admin-dashboard-constants";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function AdminDashboardQuickActions() {
  const { t: translateUi } = useLanguage();
  const { userRole } = useUser();
  const actions = canManageProjects(userRole.toUpperCase())
    ? ADMIN_DASHBOARD_ACTIONS
    : ADMIN_DASHBOARD_ACTIONS.filter(
        (action) => !action.href.startsWith("/admin/projects"),
      );

  return (
    <div className="pt-2">
      <h3 className="mb-4 px-1 text-lg font-bold tracking-tight text-gray-900 dark:text-white">
        {translateUi("Quick Actions")}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {actions.map((action) => {
          const ActionIcon = action.icon;

          return (
            <Link
              key={action.label}
              href={action.href}
              className={`group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all dark:border-gray-800 dark:bg-[#1F2937] ${action.hover}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-2.5 transition-colors group-hover:bg-white dark:bg-[#1F2937] ${action.bgIcon}`}
                >
                  <ActionIcon className={`h-5 w-5 ${action.color}`} />
                </div>
                <span className="text-xs font-semibold text-gray-800 dark:text-white">
                  {translateUi(action.label)}
                </span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500 dark:text-white" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
