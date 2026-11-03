import type { ReactNode } from "react";
import { cn } from "@/components/ui/primitives";

export type SummaryRow = {
  label: string;
  value: ReactNode;
  tone?: "default" | "success";
  /** Lets long values such as order ids wrap instead of overflowing. */
  breakAll?: boolean;
};

type SummaryRowsProps = {
  rows: SummaryRow[];
  total?: { label: string; value: ReactNode };
  className?: string;
};

/** Label/value list used by the payment breakdown and the receipt. */
export function SummaryRows({ rows, total, className }: SummaryRowsProps) {
  return (
    <dl className={cn("space-y-3 text-sm", className)}>
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-6">
          <dt className="shrink-0 text-slate-500 dark:text-slate-400">
            {row.label}
          </dt>
          <dd
            className={cn(
              "min-w-0 text-right font-bold",
              row.tone === "success"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-800 dark:text-slate-200",
              row.breakAll && "break-all",
            )}
          >
            {row.value}
          </dd>
        </div>
      ))}

      {total && (
        <div className="flex items-center justify-between gap-6 border-t border-slate-100 pt-3 dark:border-slate-800">
          <dt className="font-bold text-slate-900 dark:text-white">
            {total.label}
          </dt>
          <dd className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
            {total.value}
          </dd>
        </div>
      )}
    </dl>
  );
}
