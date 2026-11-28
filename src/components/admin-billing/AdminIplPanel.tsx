"use client";
import { useLanguage } from "@/context/LanguageContext";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  FileText,
  Plus,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { FinancePagination } from "@/components/crowdfunding/FinancePagination";
import {
  fetchIplOverview,
  fetchIplPayments,
} from "@/lib/admin-billing/admin-billing-api";
import {
  bankLabel,
  CATEGORY_META,
  CATEGORY_ORDER,
  dateTime,
  methodLabel,
  periodLabel,
  rupiah,
  shortDate,
} from "@/lib/admin-billing/admin-billing-format";
import type {
  IplOverview,
  IplPaymentCategory,
  IplPaymentList,
} from "@/lib/admin-billing/admin-billing-types";
import {
  AdminPanel,
  CategoryPill,
  DayFilter,
  PeriodPicker,
  EmptyState,
  ErrorBlock,
  focusRing,
  LoadingBlock,
  MetricCard,
  primaryButtonClass,
  secondaryButtonClass,
  tdClass,
  thClass,
} from "./AdminBillingUi";
import { AdminIplAssignDialog } from "./AdminIplAssignDialog";
import { AdminIplReceiptDialog } from "./AdminIplReceiptDialog";
import { useAdminAsync } from "./useAdminAsync";

const chartLoading = () => <LoadingBlock label="Memuat grafik…" />;
const IplTrendChart = dynamic(
  () => import("./AdminIplCharts").then((m) => m.IplTrendChart),
  { ssr: false, loading: chartLoading },
);
const IplBreakdownDonut = dynamic(
  () => import("./AdminIplCharts").then((m) => m.IplBreakdownDonut),
  { ssr: false, loading: chartLoading },
);

type CategoryFilter = "ALL" | IplPaymentCategory;

export function AdminIplPanel({
  period,
  onPeriodChange,
}: {
  period: string;
  onPeriodChange: (period: string) => void;
}) {
  const { t: translateUi } = useLanguage();

  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [residentPage, setResidentPage] = useState(1);
  // "" = seluruh bulan periode; YYYY-MM-DD = satu hari di bulan itu.
  const [day, setDay] = useState("");
  const [paymentPage, setPaymentPage] = useState(1);
  const [receiptBill, setReceiptBill] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  const overview = useAdminAsync<IplOverview>(
    (signal) =>
      fetchIplOverview({ period, page: residentPage, category }, signal),
    [period, residentPage, category],
  );
  const payments = useAdminAsync<IplPaymentList>(
    (signal) => fetchIplPayments({ period, day, page: paymentPage }, signal),
    [period, day, paymentPage],
  );

  const data = overview.data;
  const m = data?.metrics;

  const changePeriod = (next: string) => {
    onPeriodChange(next);
    setResidentPage(1);
    setDay("");
    setPaymentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PeriodPicker period={period} onChange={changePeriod} />
        <button
          type="button"
          onClick={() => setAssignOpen(true)}
          className={primaryButtonClass}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          {translateUi("Terbitkan IPL")}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MetricCard
          icon={ReceiptText}
          tone="blue"
          label={translateUi("Total tagihan")}
          value={m ? rupiah(m.billedAmount) : "-"}
        />
        <MetricCard
          icon={Wallet}
          tone="green"
          label={translateUi("Sudah dibayar")}
          value={m ? rupiah(m.paidAmount) : "-"}
          caption={
            m
              ? translateUi("{0} dari {1} rumah", {
                  0: m.paidCount,
                  1: m.billedCount,
                })
              : undefined
          }
        />
        <MetricCard
          icon={AlertTriangle}
          tone="red"
          label={translateUi("Belum dibayar")}
          value={m ? rupiah(m.unpaidAmount) : "-"}
          caption={
            m
              ? translateUi("{0} rumah · {1} lewat deadline", {
                  0: m.unpaidCount,
                  1: m.overdueCount,
                })
              : undefined
          }
        />
        <MetricCard
          icon={BadgeCheck}
          tone="yellow"
          label={translateUi("Bayar tepat waktu")}
          value={m ? `${m.onTimeRate}%` : "-"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminPanel
          title={
            Number(period.slice(0, 4)) === new Date().getFullYear()
              ? translateUi("Perkembangan Pembayaran Tahun Ini")
              : translateUi("Perkembangan Pembayaran Tahun {0}", {
                  0: period.slice(0, 4),
                })
          }
          className="lg:col-span-2"
          bodyClassName="p-4 sm:p-6"
        >
          {overview.error ? (
            <ErrorBlock message={overview.error} onRetry={overview.reload} />
          ) : data ? (
            <IplTrendChart data={data.trend} />
          ) : (
            <LoadingBlock label={translateUi("Memuat grafik…")} />
          )}
        </AdminPanel>
        <AdminPanel
          title={translateUi("Status Bulan Ini")}
          description={periodLabel(period)}
          bodyClassName="p-4 sm:p-6"
        >
          {data ? (
            data.metrics.billedCount ? (
              <IplBreakdownDonut
                breakdown={data.breakdown}
                total={data.metrics.billedCount}
              />
            ) : (
              <EmptyState
                title={translateUi("Belum ada tagihan")}
                text="Terbitkan IPL untuk periode ini agar statusnya muncul di sini."
              />
            )
          ) : (
            <LoadingBlock label={translateUi("Memuat…")} />
          )}
        </AdminPanel>
      </div>

      {/* Resident status */}
      <AdminPanel
        title={translateUi("Status Pembayaran Warga")}
        aside={
          <div
            role="group"
            aria-label={translateUi("Filter status")}
            className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
          >
            {(["ALL", ...CATEGORY_ORDER] as CategoryFilter[]).map((value) => {
              const count =
                value === "ALL"
                  ? data?.metrics.billedCount
                  : data?.breakdown[value as IplPaymentCategory];
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={category === value}
                  onClick={() => {
                    setCategory(value);
                    setResidentPage(1);
                  }}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition",
                    focusRing,
                    category === value
                      ? "border-green-600 bg-gradient-to-r from-green-600 to-green-700 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-green-400 dark:border-gray-700 dark:bg-[#111827] dark:text-gray-200",
                  )}
                >
                  {value === "ALL"
                    ? translateUi("Semua")
                    : translateUi(CATEGORY_META[value].label)}
                  {count !== undefined && (
                    <span className="tabular-nums opacity-80">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        }
      >
        {overview.error ? (
          <ErrorBlock message={overview.error} onRetry={overview.reload} />
        ) : !data ? (
          <LoadingBlock label={translateUi("Memuat status warga…")} />
        ) : !data.residents.length ? (
          <EmptyState
            title={translateUi("Tidak ada data")}
            text={
              data.metrics.billedCount
                ? "Tidak ada warga dengan status ini."
                : "Belum ada tagihan IPL untuk periode ini."
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-gray-100 xl:hidden dark:divide-gray-800">
              {data.residents.map((row) => (
                <li key={row.billId} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-gray-900 dark:text-white">
                        {row.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        {row.house || "-"} · {rupiah(row.amount)}
                      </p>
                    </div>
                    <CategoryPill category={row.category} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <dl className="flex gap-4 text-xs">
                      <div>
                        <dt className="text-gray-500 dark:text-gray-400">
                          {translateUi("Jatuh tempo")}
                        </dt>
                        <dd className="font-medium text-gray-800 dark:text-gray-100">
                          {shortDate(row.dueDate)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 dark:text-gray-400">
                          {translateUi("Dibayar")}
                        </dt>
                        <dd className="font-medium text-gray-800 dark:text-gray-100">
                          {shortDate(row.paidAt)}
                        </dd>
                      </div>
                    </dl>
                    <button
                      type="button"
                      onClick={() => setReceiptBill(row.billId)}
                      className={cn(
                        secondaryButtonClass,
                        "h-10 shrink-0 px-3 text-xs",
                      )}
                    >
                      <FileText aria-hidden="true" className="h-3.5 w-3.5" />
                      {row.paidAt
                        ? translateUi("Nota")
                        : translateUi("Rincian")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[720px]">
                <thead className="border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th scope="col" className={thClass}>
                      {translateUi("Warga")}
                    </th>
                    <th scope="col" className={thClass}>
                      {translateUi("Nominal")}
                    </th>
                    <th scope="col" className={thClass}>
                      {translateUi("Jatuh tempo")}
                    </th>
                    <th scope="col" className={thClass}>
                      {translateUi("Dibayar")}
                    </th>
                    <th scope="col" className={thClass}>
                      {translateUi("Status")}
                    </th>
                    <th scope="col" className={cn(thClass, "text-right")}>
                      {translateUi("Aksi")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {data.residents.map((row) => (
                    <tr
                      key={row.billId}
                      className="transition hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <td className={tdClass}>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {row.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-300">
                          {row.house || "-"}
                        </p>
                      </td>
                      <td
                        className={cn(
                          tdClass,
                          "tabular-nums text-gray-900 dark:text-white",
                        )}
                      >
                        {rupiah(row.amount)}
                      </td>
                      <td
                        className={cn(
                          tdClass,
                          "text-gray-600 dark:text-gray-300",
                        )}
                      >
                        {shortDate(row.dueDate)}
                      </td>
                      <td
                        className={cn(
                          tdClass,
                          "text-gray-600 dark:text-gray-300",
                        )}
                      >
                        {shortDate(row.paidAt)}
                      </td>
                      <td className={tdClass}>
                        <CategoryPill category={row.category} />
                      </td>
                      <td className={cn(tdClass, "text-right")}>
                        <button
                          type="button"
                          onClick={() => setReceiptBill(row.billId)}
                          className={cn(
                            secondaryButtonClass,
                            "h-9 px-3 text-xs",
                          )}
                        >
                          <FileText
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                          />
                          {row.paidAt
                            ? translateUi("Nota")
                            : translateUi("Rincian")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {data && (
          <div className="px-5 pb-4 sm:px-6">
            <FinancePagination
              label={translateUi("status warga")}
              {...data.residentPagination}
              onPage={setResidentPage}
            />
          </div>
        )}
      </AdminPanel>

      {/* Payment history */}
      <AdminPanel
        title={translateUi("Riwayat Pembayaran IPL")}
        aside={
          <DayFilter
            period={period}
            day={day}
            onChange={(next) => {
              setDay(next);
              setPaymentPage(1);
            }}
          />
        }
      >
        {payments.error ? (
          <ErrorBlock message={payments.error} onRetry={payments.reload} />
        ) : payments.loading && !payments.data ? (
          <LoadingBlock label={translateUi("Memuat riwayat…")} />
        ) : !payments.data?.rows.length ? (
          <EmptyState
            title={translateUi("Belum ada pembayaran")}
            text="Tidak ada IPL yang dibayar pada rentang waktu ini."
          />
        ) : (
          <>
            <ul
              className={cn(
                "divide-y divide-gray-100 transition-opacity xl:hidden dark:divide-gray-800",
                payments.loading && "opacity-60",
              )}
            >
              {payments.data.rows.map((row) => (
                <li key={row.billId} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-gray-900 dark:text-white">
                        {row.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        {translateUi("IPL ")}
                        {row.period} · {row.house || "-"}
                      </p>
                    </div>
                    <p className="shrink-0 font-bold tabular-nums text-green-700 dark:text-green-400">
                      {rupiah(row.amount)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                      <span>{dateTime(row.paidAt)}</span>
                      <span>{methodLabel(row.method)}</span>
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {bankLabel(row.bank)}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setReceiptBill(row.billId)}
                      className={cn(
                        secondaryButtonClass,
                        "h-10 shrink-0 px-3 text-xs",
                      )}
                    >
                      <FileText aria-hidden="true" className="h-3.5 w-3.5" />
                      {translateUi("Detail")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div
              className={cn(
                "hidden overflow-x-auto transition-opacity xl:block",
                payments.loading && "opacity-60",
              )}
            >
              <table className="w-full min-w-[820px]">
                <thead className="border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th scope="col" className={thClass}>
                      {translateUi("Tanggal bayar")}
                    </th>
                    <th scope="col" className={thClass}>
                      {translateUi("Warga")}
                    </th>
                    <th scope="col" className={thClass}>
                      {translateUi("Periode")}
                    </th>
                    <th scope="col" className={thClass}>
                      {translateUi("Metode")}
                    </th>
                    <th scope="col" className={thClass}>
                      {translateUi("Bank")}
                    </th>
                    <th scope="col" className={cn(thClass, "text-right")}>
                      {translateUi("Nominal")}
                    </th>
                    <th scope="col" className={cn(thClass, "text-right")}>
                      {translateUi("Aksi")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {payments.data.rows.map((row) => (
                    <tr
                      key={row.billId}
                      className="transition hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <td
                        className={cn(
                          tdClass,
                          "whitespace-nowrap text-gray-600 dark:text-gray-300",
                        )}
                      >
                        {dateTime(row.paidAt)}
                      </td>
                      <td className={tdClass}>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {row.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-300">
                          {row.house || "-"}
                        </p>
                      </td>
                      <td
                        className={cn(
                          tdClass,
                          "text-gray-700 dark:text-gray-200",
                        )}
                      >
                        {row.period}
                      </td>
                      <td
                        className={cn(
                          tdClass,
                          "text-gray-700 dark:text-gray-200",
                        )}
                      >
                        {methodLabel(row.method)}
                      </td>
                      <td className={tdClass}>
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                          {bankLabel(row.bank)}
                        </span>
                      </td>
                      <td
                        className={cn(
                          tdClass,
                          "text-right font-bold tabular-nums text-green-700 dark:text-green-400",
                        )}
                      >
                        {rupiah(row.amount)}
                      </td>
                      <td className={cn(tdClass, "text-right")}>
                        <button
                          type="button"
                          onClick={() => setReceiptBill(row.billId)}
                          className={cn(
                            secondaryButtonClass,
                            "h-9 px-3 text-xs",
                          )}
                        >
                          <FileText
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                          />
                          {translateUi("Detail")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {payments.data && (
          <div className="px-5 pb-4 sm:px-6">
            <FinancePagination
              label={translateUi("riwayat pembayaran")}
              {...payments.data.pagination}
              onPage={setPaymentPage}
            />
          </div>
        )}
      </AdminPanel>

      {receiptBill && (
        <AdminIplReceiptDialog
          billId={receiptBill}
          onClose={() => setReceiptBill(null)}
        />
      )}
      {assignOpen && (
        <AdminIplAssignDialog
          defaultPeriod={period}
          onClose={() => setAssignOpen(false)}
          onDone={(nextPeriod) => {
            setAssignOpen(false);
            changePeriod(nextPeriod);
            overview.reload();
          }}
        />
      )}
    </div>
  );
}
