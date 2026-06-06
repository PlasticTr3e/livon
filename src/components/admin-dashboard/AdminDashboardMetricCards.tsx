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
    <div className="flex w-full flex-col gap-4 lg:flex-row">
      <DashboardMetricCard stat={stats[0]} isPrimary />

      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
        {stats.slice(1).map((stat) => (
          <DashboardMetricCard key={stat.title} stat={stat} />
        ))}
      </div>
    </div>
  );
}

type DashboardMetricCardProps = {
  stat: (typeof ADMIN_DASHBOARD_STAT_STYLES)[number] & { value: string };
  isPrimary?: boolean;
};

function DashboardMetricCard({ stat, isPrimary }: DashboardMetricCardProps) {
  const StatIcon = stat.icon;
  const iconSize = isPrimary ? "h-6 w-6" : "h-5 w-5";
  const iconWrapperSize = isPrimary ? "h-12 w-12" : "h-10 w-10";
  const valueSize = isPrimary ? "text-2xl" : "text-lg";
  const labelSize = isPrimary ? "text-[10px]" : "text-[9px]";

  return (
    <Card
      className={`group relative flex items-center gap-3 p-4 ${stat.wrapperClass} ${
        isPrimary ? "shrink-0 gap-4 lg:w-[40%]" : ""
      }`}
    >
      <MetricTooltip title={stat.title} value={stat.value} />

      <div
        className={`${iconWrapperSize} flex shrink-0 items-center justify-center rounded-full ${stat.iconBg} ${stat.iconColor}`}
      >
        <StatIcon className={iconSize} />
      </div>
      <div className="flex-1 truncate">
        <p
          className={`${labelSize} mb-0.5 truncate font-bold uppercase text-gray-400 dark:text-white`}
        >
          {stat.title}
        </p>
        <p
          className={`${valueSize} truncate font-black text-gray-900 dark:text-white`}
        >
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
