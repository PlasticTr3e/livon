"use client";
import { useLanguage } from "@/context/LanguageContext";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
} from "@/lib/admin-billing/admin-billing-format";
import type {
  IplPaymentCategory,
  IplTrendPoint,
} from "@/lib/admin-billing/admin-billing-types";

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  fontSize: 12,
};

/** Perkembangan kedisiplinan bayar per bulan (stacked, jumlah rumah). */
export function IplTrendChart({ data }: { data: IplTrendPoint[] }) {
  const { t: translateUi } = useLanguage();

  return (
    <div
      className="h-[300px] w-full"
      role="img"
      aria-label={translateUi(
        "Grafik perkembangan pembayaran IPL Januari sampai Desember",
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
          />
          <XAxis
            dataKey="label"
            tickFormatter={(value) => translateUi(String(value))}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={6}
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.12)" }}
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              translateUi("{0} rumah", { 0: value }),
              translateUi(
                CATEGORY_META[name as IplPaymentCategory]?.label ??
                  String(name),
              ),
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) =>
              translateUi(
                CATEGORY_META[value as IplPaymentCategory]?.label ??
                  String(value),
              )
            }
          />
          {CATEGORY_ORDER.map((category, index) => (
            <Bar
              key={category}
              dataKey={category}
              stackId="ipl"
              fill={CATEGORY_META[category].color}
              radius={
                index === CATEGORY_ORDER.length - 1
                  ? [4, 4, 0, 0]
                  : [0, 0, 0, 0]
              }
              maxBarSize={32}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Komposisi status pada periode terpilih. */
export function IplBreakdownDonut({
  breakdown,
  total,
}: {
  breakdown: Record<IplPaymentCategory, number>;
  total: number;
}) {
  const { t: translateUi } = useLanguage();

  const data = CATEGORY_ORDER.map((category) => ({
    name: category,
    value: breakdown[category],
  })).filter((item) => item.value > 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="66%"
              outerRadius="92%"
              paddingAngle={data.length > 1 ? 3 : 0}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={CATEGORY_META[entry.name as IplPaymentCategory].color}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [
                translateUi("{0} rumah", { 0: value }),
                translateUi(
                  CATEGORY_META[name as IplPaymentCategory]?.label ??
                    String(name),
                ),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-gray-900 dark:text-white">
            {total}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-300">
            {translateUi("Tagihan")}
          </span>
        </div>
      </div>
      <ul className="mt-4 grid w-full grid-cols-1 gap-x-4 gap-y-2.5 border-t border-gray-100 pt-4 dark:border-gray-800">
        {CATEGORY_ORDER.map((category) => {
          const value = breakdown[category];
          const percent = total ? Math.round((value / total) * 100) : 0;
          return (
            <li
              key={category}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_META[category].color }}
                />
                <span className="truncate">
                  {translateUi(CATEGORY_META[category].label)}
                </span>
              </span>
              <span className="shrink-0 font-bold tabular-nums text-gray-900 dark:text-white">
                {value}
                <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">
                  {percent}%
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
