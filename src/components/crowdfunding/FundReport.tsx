"use client";
import { useLanguage } from "@/context/LanguageContext";

import type { ReactNode } from "react";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { formatRupiah, formatShortDate } from "@/lib/payment/billing";
import type { FinanceHubData } from "./useFinanceHub";

export function FundReport({
  data,
  fund,
  setFund,
  children,
}: {
  data: FinanceHubData;
  fund: "ALL" | "IPL" | "DONASI";
  setFund: (fund: "ALL" | "IPL" | "DONASI") => void;
  children?: ReactNode;
}) {
  const { t: translateUi, locale: uiLocale } = useLanguage();

  const expenses = data.expenses.filter(
    (item) => fund === "ALL" || item.fundType === fund,
  );
  return (
    <>
      <FeatureCard className="min-w-0">
        <section aria-labelledby="fund-summary">
          <h2
            id="fund-summary"
            className="text-lg font-semibold text-slate-950 dark:text-white"
          >
            {translateUi("Kas lingkungan")}
          </h2>
          <dl className="mt-4 space-y-3">
            {[
              ["Saldo iuran (IPL)", data.summary.iplBalance],
              ["Saldo donasi", data.summary.donationBalance],
              ["Pengeluaran bulan ini", data.summary.monthlyExpense],
            ].map(([label, amount]) => (
              <div
                key={label}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
              >
                <dt className="text-sm text-slate-600 dark:text-slate-300">
                  {translateUi(label)}
                </dt>
                <dd className="text-lg font-semibold tabular-nums text-slate-950 dark:text-white">
                  {formatRupiah(Number(amount))}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-slate-600 dark:text-slate-400">
            {translateUi("Diambil dari pembukuan Livon ·")}{" "}
            {new Date(data.updatedAt).toLocaleString(uiLocale)}
          </p>
        </section>
      </FeatureCard>
      <FeatureCard className="min-w-0 lg:col-span-3">
        <section aria-labelledby="fund-expenses">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="fund-expenses"
              className="text-lg font-semibold text-slate-950 dark:text-white"
            >
              {translateUi("Penggunaan dana")}
            </h2>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              {translateUi("Sumber dana")}
              <select
                value={fund}
                onChange={(event) =>
                  setFund(event.target.value as "ALL" | "IPL" | "DONASI")
                }
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-900"
              >
                <option value="ALL">{translateUi("Semua dana")}</option>
                <option value="IPL">{translateUi("Iuran (IPL)")}</option>
                <option value="DONASI">{translateUi("Donasi")}</option>
              </select>
            </label>
          </div>
          {!expenses.length ? (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              {translateUi("Belum ada pengeluaran untuk sumber dana ini.")}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
              {expenses.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-start justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {formatShortDate(item.transactionDate)} ·{" "}
                      {item.fundType === "IPL"
                        ? translateUi("IPL")
                        : translateUi("Donasi")}{" "}
                      · {item.category}
                    </p>
                    {item.description && (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {item.description}
                      </p>
                    )}
                    {item.proofUrl && (
                      <a
                        href={item.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-green-800 underline dark:text-green-300"
                      >
                        {translateUi("Lihat bukti pengeluaran")}
                      </a>
                    )}
                  </div>
                  <p className="shrink-0 font-medium tabular-nums text-slate-950 dark:text-white">
                    {formatRupiah(item.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {data.expensePagination.total > data.expenses.length && (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {translateUi("Menampilkan ")}
              {data.expenses.length} {translateUi(" dari")}{" "}
              {data.expensePagination.total}{" "}
              {translateUi(" pengeluaran terbaru.")}
            </p>
          )}
          {children}
        </section>
      </FeatureCard>
    </>
  );
}
