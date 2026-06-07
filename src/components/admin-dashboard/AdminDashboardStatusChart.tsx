import { Card } from "@/components/ui/primitives";
import { PROJECT_STATUS_COLORS } from "@/lib/admin-dashboard/admin-dashboard-constants";
import type {
  AdminDashboardMetrics,
  ProjectStatusChartItem,
} from "@/lib/admin-dashboard/admin-dashboard-types";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

type AdminDashboardStatusChartProps = {
  data: ProjectStatusChartItem[];
  metrics: AdminDashboardMetrics;
};

export function AdminDashboardStatusChart({
  data,
  metrics,
}: AdminDashboardStatusChartProps) {
  return (
    <Card className="flex min-h-[350px] flex-col border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#1F2937]">
      <div className="mb-5">
        <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          Project Status
        </h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-white">
          Current project proportion distribution
        </p>
      </div>
      <div className="mt-2 flex flex-1 flex-col">
        {data.length > 0 ? (
          <div className="flex w-full flex-col items-center">
            <div className="relative mb-6 flex h-[180px] w-full items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    innerRadius="65%"
                    outerRadius="90%"
                    dataKey="value"
                    paddingAngle={4}
                    stroke="none"
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={PROJECT_STATUS_COLORS[entry.name] || "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black leading-none text-gray-900 dark:text-white">
                  {metrics.totalProyek}
                </span>
                <span className="mt-0.5 text-[10px] font-bold uppercase text-gray-400 dark:text-white">
                  Projects
                </span>
              </div>
            </div>

            <ProjectStatusLegend
              data={data}
              totalProjects={metrics.totalProyek}
            />
          </div>
        ) : (
          <EmptyProjectStatus />
        )}
      </div>
    </Card>
  );
}

function ProjectStatusLegend({
  data,
  totalProjects,
}: {
  data: ProjectStatusChartItem[];
  totalProjects: number;
}) {
  return (
    <div className="flex w-full flex-wrap justify-center gap-x-6 gap-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
      {data.map((item) => {
        const percentage =
          totalProjects > 0
            ? Math.round((item.value / totalProjects) * 100)
            : 0;

        return (
          <div
            key={item.name}
            className="flex min-w-[60px] flex-col items-center"
          >
            <div className="mb-1 flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    PROJECT_STATUS_COLORS[item.name] || "#94a3b8",
                }}
              />
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-white">
                {item.name}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-gray-900 dark:text-white">
                {item.value}
              </span>
              <span className="rounded-md border border-gray-100 bg-gray-50 px-1.5 py-0.5 text-[9px] font-bold text-gray-400 dark:border-gray-800 dark:bg-[#111827] dark:text-white">
                {percentage}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyProjectStatus() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-[#111827]">
      <p className="text-sm font-medium text-gray-400 dark:text-white">
        No project data available
      </p>
    </div>
  );
}
