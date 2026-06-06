import { Card } from "@/components/ui/primitives";
import type { ProjectSentimentChartItem } from "@/lib/admin-dashboard/admin-dashboard-types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

type AdminDashboardSentimentChartProps = {
  data: ProjectSentimentChartItem[];
};

export function AdminDashboardSentimentChart({
  data,
}: AdminDashboardSentimentChartProps) {
  return (
    <Card className="flex min-h-[350px] flex-col border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#1F2937] lg:col-span-2">
      <div className="mb-5">
        <h3 className="font-bold text-gray-900 dark:text-white">
          Project Sentiment Distribution
        </h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-white">
          Comparison of comment sentiment on top 5 projects
        </p>
      </div>
      <div className="mt-2 min-h-0 w-full flex-1 pl-0">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f3f4f6"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                allowDecimals={false}
              />
              <RechartsTooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                cursor={{ fill: "#f9fafb" }}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    return payload[0].payload.fullName || label;
                  }

                  return label;
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", paddingTop: "15px" }}
              />
              <Bar
                dataKey="Positive"
                stackId="a"
                fill="#10b981"
                radius={[0, 0, 4, 4]}
                barSize={40}
              />
              <Bar dataKey="Neutral" stackId="a" fill="#9ca3af" />
              <Bar
                dataKey="Negative"
                stackId="a"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartState message="No sentiment data available" />
        )}
      </div>
    </Card>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-[#111827]">
      <p className="text-sm font-medium text-gray-400 dark:text-white">
        {message}
      </p>
    </div>
  );
}
