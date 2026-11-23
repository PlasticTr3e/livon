"use client";

import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/components/ui/primitives";
import { parseBillItems } from "@/lib/finance/bill-items";
import type { ResidentBillItem } from "@/lib/finance/finance-types";
import { formatRupiah } from "@/lib/payment/billing";

/**
 * Rincian biaya IPL per baris (sesuai yang diinput pengurus) + total.
 * Tagihan lama tanpa rincian tampil sebagai satu baris berisi total.
 */
export function BillBreakdown({
  bill,
  className,
  title = "Rincian biaya",
}: {
  bill: Pick<ResidentBillItem, "amount" | "items">;
  className?: string;
  title?: string;
}) {
  const { t: translateUi } = useLanguage();

  const items = bill.items?.length
    ? bill.items
    : parseBillItems(null, bill.amount);
  const listed = items.reduce((sum, item) => sum + item.amount, 0);
  // Never show a total that disagrees with what the resident is charged.
  const mismatch = Math.round(listed) !== Math.round(bill.amount);

  return (
    <div className={className}>
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
        {title}
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-baseline justify-between gap-4 text-sm"
          >
            <span className="min-w-0 text-slate-700 dark:text-slate-300">
              {item.label}
            </span>
            <span className="shrink-0 tabular-nums text-slate-900 dark:text-white">
              {formatRupiah(item.amount)}
            </span>
          </li>
        ))}
      </ul>
      <div
        className={cn(
          "mt-3 flex items-baseline justify-between gap-4 border-t border-dashed border-slate-300 pt-3 dark:border-slate-700",
        )}
      >
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          {translateUi("Total")}
        </span>
        <span className="text-base font-black tabular-nums text-slate-900 dark:text-white">
          {formatRupiah(bill.amount)}
        </span>
      </div>
      {mismatch && (
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          {translateUi(
            "Total mengikuti nominal tagihan yang diterbitkan pengurus.",
          )}
        </p>
      )}
    </div>
  );
}
