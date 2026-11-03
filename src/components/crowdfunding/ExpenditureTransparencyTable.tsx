"use client";

import { useId, useState } from "react";
import { ChevronDown, ReceiptText } from "lucide-react";
import { formatRupiah, formatShortDate } from "@/lib/payment/billing";
import type { Expenditure, FundType } from "@/lib/payment/finance-store";

const FUND_OPTIONS: { value: FundType; label: string }[] = [
  { value: "ipl", label: "Dana IPL" },
  { value: "donation", label: "Dana Donasi" },
];

type ExpenditureTransparencyTableProps = {
  getExpenditures: (fund: FundType) => Expenditure[];
};

export function ExpenditureTransparencyTable({
  getExpenditures,
}: ExpenditureTransparencyTableProps) {
  const selectId = useId();
  const [fund, setFund] = useState<FundType>("ipl");
  const items = getExpenditures(fund);
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 sm:text-xl dark:text-white">
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
            onChange={(event) => setFund(event.target.value as FundType)}
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

      {items.length === 0 ? (
        <p className="border-t border-slate-100 px-5 py-10 text-center text-sm text-slate-500 dark:border-slate-800">
          Belum ada pengeluaran tercatat untuk dana ini.
        </p>
      ) : (
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
                      {formatShortDate(item.date)}
                    </td>
                    <td className="px-6 py-5 font-semibold text-slate-900 dark:text-slate-100">
                      {item.description}
                    </td>
                    <td className="px-6 py-5 text-slate-400">
                      {item.note || "—"}
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
            {items.map((item) => (
              <li key={item.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.description}
                  </p>
                  <span className="whitespace-nowrap font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                    − {formatRupiah(item.amount)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {formatShortDate(item.date)}
                  {item.note ? ` · ${item.note}` : ""}
                </p>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 text-sm sm:px-6 dark:border-slate-800">
            <span className="text-slate-400">
              {items.length} transaksi tercatat
            </span>
            <strong className="text-slate-900 dark:text-white">
              Total: {formatRupiah(total)}
            </strong>
          </div>
        </>
      )}
    </section>
  );
}
