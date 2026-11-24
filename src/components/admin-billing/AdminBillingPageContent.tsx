"use client";

import { useState } from "react";
import {
  CircleDashed,
  HandHeart,
  Hourglass,
  Landmark,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { FinanceStatCard } from "@/components/crowdfunding/FinanceStatCard";
import { FinanceLoadError } from "@/components/payment/FinanceLoadError";
import {
  formatBillingPeriod,
  formatCompactRupiah,
  toBillingPeriod,
} from "@/lib/payment/billing";
import {
  useAdminWargaBills,
  useFinanceSummary,
} from "@/lib/payment/finance-data";
import { ExpenseReportForm } from "./ExpenseReportForm";
import { FinanceLedgerTable } from "./FinanceLedgerTable";
import { IplBillGenerateForm } from "./IplBillGenerateForm";
import { IplBillsPanel } from "./IplBillsPanel";

/** Admin "Manajemen Keuangan": KPIs, IPL bills, expense input, and the ledger. */
export function AdminBillingPageContent() {
  const [revision, setRevision] = useState(0);
  const finance = useFinanceSummary();
  const wargaBills = useAdminWargaBills(revision);
  const isBillsLoading = wargaBills.isLoading && !wargaBills.data;
  const summary = finance.summary;
  const isSummaryLoading = finance.isLoading && !summary;
  const monthLabel = formatBillingPeriod(toBillingPeriod(new Date()));

  /** Any write changes balances and lists, so refetch everything. */
  function refreshAll() {
    setRevision((value) => value + 1);
    finance.reload();
  }

  return (
    <div className="min-h-full space-y-6 bg-slate-50 p-4 sm:p-6 md:p-8 dark:bg-[#0B1120]">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Manajemen Keuangan
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Pantau pembayaran IPL, donasi, dan seluruh pergerakan dana warga.
          </p>
        </div>
      </div>

      {finance.error && (
        <FinanceLoadError message={finance.error} onRetry={finance.reload} />
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <FinanceStatCard
          label="Saldo kas IPL"
          value={formatCompactRupiah(summary?.iplBalance ?? 0)}
          caption="Dana operasional warga"
          icon={Landmark}
          tone="brown"
          size="compact"
          isLoading={isSummaryLoading}
        />
        <FinanceStatCard
          label="Saldo kas donasi"
          value={formatCompactRupiah(summary?.donationBalance ?? 0)}
          caption="Dana sosial tersedia"
          icon={HandHeart}
          tone="blue"
          size="compact"
          isLoading={isSummaryLoading}
        />
        <FinanceStatCard
          label="Pemasukan bulan ini"
          value={formatCompactRupiah(
            summary?.overview?.totalIncomeThisMonth ?? 0,
          )}
          caption={monthLabel}
          icon={TrendingUp}
          tone="green"
          size="compact"
          isLoading={isSummaryLoading}
        />
        <FinanceStatCard
          label="Pengeluaran bulan ini"
          value={formatCompactRupiah(summary?.monthlyExpense ?? 0)}
          caption={monthLabel}
          icon={TrendingDown}
          tone="amber"
          size="compact"
          isLoading={isSummaryLoading}
        />
        <FinanceStatCard
          label="Perlu verifikasi"
          value={wargaBills.awaitingCount.toLocaleString("id-ID")}
          caption="Pembayaran IPL masuk"
          icon={Hourglass}
          tone="amber"
          size="compact"
          isLoading={isBillsLoading}
        />
        <FinanceStatCard
          label="Belum bayar"
          value={wargaBills.unpaidCount.toLocaleString("id-ID")}
          caption="Tagihan IPL aktif"
          icon={CircleDashed}
          tone="down"
          size="compact"
          isLoading={isBillsLoading}
        />
      </div>

      <IplBillsPanel
        allBills={wargaBills.bills}
        isLoading={wargaBills.isLoading}
        error={wargaBills.error}
        onRetry={wargaBills.reload}
        onChanged={refreshAll}
      />

      <div className="grid items-stretch gap-6 xl:grid-cols-2">
        <ExpenseReportForm onSaved={refreshAll} />
        <IplBillGenerateForm onGenerated={refreshAll} />
      </div>

      <FinanceLedgerTable refreshKey={revision} />
    </div>
  );
}
