"use client";

import { useId, useState } from "react";
import { ChevronDown, ReceiptText } from "lucide-react";
import { FinanceLoadError } from "@/components/payment/FinanceLoadError";
import { formatRupiah, formatShortDate } from "@/lib/payment/billing";
import { useFundExpenses, type ApiFundType } from "@/lib/payment/finance-data";

const FUND_OPTIONS: { value: ApiFundType; label: string }[] = [
  { value: "IPL", label: "Dana IPL" },
  { value: "DONASI", label: "Dana Donasi" },
];

const EXPENSE_LIMIT = 50;

function getNote(item: {
  description: string | null;
  category: string | null;
}) {
  return item.description || item.category || "";
}

function TableSkeleton() {
  return (
    <ul
      aria-hidden="true"
      className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800"
    >
      {[0, 1, 2].map((row) => (
        <li
          key={row}
          className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6"
        >
          <span className="h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <span className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </li>
      ))}
    </ul>
  );
}

export function ExpenditureTransparencyTable() {
  const selectId = useId();
  const [fund, setFund] = useState<ApiFundType>("IPL");
  const {
    expenses: items,
    total: count,
    isLoading,
    error,
    reload,
  } = useFundExpenses(fund, EXPENSE_LIMIT);
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const showSkeleton = isLoading && items.length === 0;

  function renderBody() {
    if (error) {
      return (
        <div className="border-t border-slate-100 p-5 dark:border-slate-800">
          <FinanceLoadError message={error} onRetry={reload} />
        </div>
      );
    }

    if (showSkeleton) return <TableSkeleton />;

    if (items.length === 0) {
      return (
        <p className="border-t border-slate-100 px-5 py-10 text-center text-sm text-slate-500 dark:border-slate-800">
          Belum ada pengeluaran tercatat untuk dana ini.
        </p>
      );
    }

    return (
      <>
        {/* Desktop & tablet: full table */}
        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:bg-slate-800/50">
              <tr>
                <th scope="col" className="px-6 py-4 font-bold">
                  Tanggal
                </th>
                <th scope="col" className="px-6 py-4 font-bold">
                  Pengeluaran
                </th>
                <th scope="col" className="px-6 py-4 font-bold">
                  Catatan
                </th>
                <th scope="col" className="px-6 py-4 text-right font-bold">
                  Nominal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap px-6 py-5 text-slate-500 dark:text-slate-400">
                    {formatShortDate(item.transactionDate)}
                  </td>
                  <td className="px-6 py-5 font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </td>
                  <td className="px-6 py-5 text-slate-400">
                    {getNote(item) || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                    − {formatRupiah(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: stacked rows, no horizontal scrolling */}
        <ul className="divide-y divide-slate-100 border-t border-slate-100 md:hidden dark:divide-slate-800 dark:border-slate-800">
          {items.map((item) => {
            const note = getNote(item);
            return (
              <li key={item.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </p>
                  <span className="whitespace-nowrap font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                    − {formatRupiah(item.amount)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {formatShortDate(item.transactionDate)}
                  {note ? ` · ${note}` : ""}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 text-sm sm:px-6 dark:border-slate-800">
          <span className="text-slate-400">
            {count > items.length
              ? `${items.length} dari ${count} transaksi terbaru`
              : `${count} transaksi tercatat`}
          </span>
          <strong className="text-slate-900 dark:text-white">
            Total: {formatRupiah(total)}
          </strong>
        </div>
      </>
    );
  }

  return (
    <section
      aria-busy={isLoading}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <ReceiptText
              aria-hidden="true"
              className="h-5 w-5 text-green-700 dark:text-green-400"
            />
            Transparansi pengeluaran dana
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Laporan yang dicatat pengelola dan dapat diperiksa seluruh warga.
          </p>
        </div>

        <div className="relative shrink-0">
          <label htmlFor={selectId} className="sr-only">
            Pilih sumber dana
          </label>
          <select
            id={selectId}
            value={fund}
            onChange={(event) => setFund(event.target.value as ApiFundType)}
            className="h-12 w-full appearance-none rounded-xl border border-green-200 bg-white pl-4 pr-10 text-sm font-semibold text-green-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 sm:w-44 dark:border-green-900 dark:bg-slate-900 dark:text-green-300 dark:focus:ring-green-900"
          >
            {FUND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-700 dark:text-green-400"
          />
        </div>
      </div>

      {renderBody()}
    </section>
  );
}
