"use client";
import { useLanguage } from "@/context/LanguageContext";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { rupiah } from "@/lib/admin-billing/admin-billing-format";
import type { DonationTrendPoint } from "@/lib/admin-billing/admin-billing-types";

type TooltipPayload = {
  active?: boolean;
  payload?: { payload: DonationTrendPoint }[];
};

function TrendTooltip({ active, payload }: TooltipPayload) {
  const { t: translateUi, locale: uiLocale } = useLanguage();

  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const label = new Date(`${point.period}-01T00:00:00`).toLocaleDateString(
    uiLocale,
    { month: "long", year: "numeric" },
  );
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md dark:border-gray-700 dark:bg-[#111827]">
      <p className="font-semibold text-gray-900 dark:text-white">
        {translateUi(label)}
      </p>
      <p className="mt-1 text-blue-700 dark:text-blue-300">
        {point.count} {translateUi(" donasi")}
      </p>
      <p className="text-gray-600 dark:text-gray-300">{rupiah(point.amount)}</p>
    </div>
  );
}

/**
 * Antusiasme donasi: jumlah donasi tiap bulan sepanjang tahun periode.
 * Bulan yang sedang dipilih ditandai garis putus-putus.
 */
export function DonationTrendChart({
  data,
  selectedPeriod,
}: {
  data: DonationTrendPoint[];
  selectedPeriod: string;
}) {
  const { t: translateUi } = useLanguage();

  const selected = data.find((point) => point.period === selectedPeriod);
  return (
    <div
      className="h-[280px] w-full"
      role="img"
      aria-label={translateUi("Grafik jumlah donasi per bulan: {0}", {
        0: data.map((point) => `${point.label} ${point.count}`).join(", "),
      })}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
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
          {selected && (
            <ReferenceLine
              x={selected.label}
              stroke="#16a34a"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
          )}
          <Tooltip
            content={<TrendTooltip />}
            cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }}
          />
          <Line
            type="monotone"
            dataKey="count"
            name={translateUi("Jumlah donasi")}
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: "#3b82f6", strokeWidth: 0 }}
            activeDot={{
              r: 6,
              fill: "#3b82f6",
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
