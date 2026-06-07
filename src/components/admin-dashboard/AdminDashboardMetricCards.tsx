import { Card } from "@/components/ui/primitives";
import { ADMIN_DASHBOARD_STAT_STYLES } from "@/lib/admin-dashboard/admin-dashboard-constants";
import { formatDashboardStats } from "@/lib/admin-dashboard/admin-dashboard-format";
import type { AdminDashboardMetrics } from "@/lib/admin-dashboard/admin-dashboard-types";

type AdminDashboardMetricCardsProps = {
  metrics: AdminDashboardMetrics;
};

export function AdminDashboardMetricCards({
  metrics,
}: AdminDashboardMetricCardsProps) {
  const statValues = formatDashboardStats(metrics);
  const stats = ADMIN_DASHBOARD_STAT_STYLES.map((stat, index) => ({
    ...stat,
    value: statValues[index],
  }));

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <DashboardMetricCard key={stat.title} stat={stat} />
      ))}
    </div>
  );
}

type DashboardMetricCardProps = {
  stat: (typeof ADMIN_DASHBOARD_STAT_STYLES)[number] & { value: string };
};

function DashboardMetricCard({ stat }: DashboardMetricCardProps) {
  const StatIcon = stat.icon;

  return (
    <Card
      className={`group relative flex min-h-28 items-center gap-3 p-4 ${stat.wrapperClass}`}
    >
      <MetricTooltip title={stat.title} value={stat.value} />

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${stat.iconBg} ${stat.iconColor}`}
      >
        <StatIcon className="h-5 w-5" />
      </div>
      <div className="flex-1 truncate">
        <p className="mb-0.5 truncate text-[9px] font-bold uppercase text-gray-400 dark:text-white">
          {stat.title}
        </p>
        <p className="truncate text-xl font-black text-gray-900 dark:text-white">
          {stat.value}
        </p>
      </div>
    </Card>
  );
}

function MetricTooltip({ title, value }: { title: string; value: string }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-xs font-bold text-white shadow-lg group-hover:block">
      {title}: {value}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-gray-900" />
    </div>
  );
}
