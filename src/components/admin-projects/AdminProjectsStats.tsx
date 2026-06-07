import { Card, cn } from "@/components/ui/primitives";
import {
  ADMIN_PROJECT_STATUSES,
  ADMIN_PROJECT_STATUS_CONFIG,
} from "@/lib/admin-projects/admin-projects-format";
import type { AdminProjectSummary } from "@/lib/admin-projects/admin-projects-types";
import { AdminProjectStatusIcon } from "./AdminProjectStatusIcon";

type AdminProjectsStatsProps = {
  isLoading: boolean;
  projects: AdminProjectSummary[];
};

export function AdminProjectsStats({
  isLoading,
  projects,
}: AdminProjectsStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {ADMIN_PROJECT_STATUSES.map((status) => {
        const count = projects.filter(
          (project) => project.status === status,
        ).length;
        const config = ADMIN_PROJECT_STATUS_CONFIG[status];

        return (
          <Card
            key={status}
            className="flex items-center gap-4 rounded-2xl border-green-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#1F2937]"
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full shadow-inner transition-colors",
                config.iconBg,
                config.iconColor,
              )}
            >
              <AdminProjectStatusIcon status={status} />
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-white">
                {config.label}
              </p>
              <p className="text-2xl font-black leading-none text-gray-900 dark:text-white">
                {isLoading ? "..." : count}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
