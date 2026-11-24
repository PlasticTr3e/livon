"use client";

import { useState } from "react";
import { ChevronDown, NotebookText, ShieldCheck } from "lucide-react";
import { AdminPagination } from "./AdminPagination";
import { FinanceLoadError } from "@/components/payment/FinanceLoadError";
import { PersonAvatar } from "@/components/payment/PersonAvatar";
import { cn } from "@/components/ui/primitives";
import { formatRupiah, formatShortDate } from "@/lib/payment/billing";
import {
  useFundLedger,
  type ApiFundType,
  type LedgerEntry,
} from "@/lib/payment/finance-data";
import {
  adminCardClass,
  adminFieldClass,
  adminTableHeadClass,
} from "./admin-billing-styles";

const PAGE_SIZE = 10;

const FUND_OPTIONS: { value: ApiFundType; label: string }[] = [
  { value: "IPL", label: "Riwayat Dana IPL" },
  { value: "DONASI", label: "Riwayat Dana Donasi" },
];

function TypeBadge({ type }: { type: LedgerEntry["type"] }) {
  const isIncome = type === "PEMASUKAN";
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold",
        isIncome
          ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
          : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
      )}
    >
      {isIncome ? "Pemasukan" : "Pengeluaran"}
    </span>
  );
}

function SignedAmount({ entry }: { entry: LedgerEntry }) {
  const isIncome = entry.type === "PEMASUKAN";
  return (
    <span
      className={cn(
        "whitespace-nowrap font-bold tabular-nums",
        isIncome
          ? "text-green-700 dark:text-green-400"
          : "text-rose-600 dark:text-rose-400",
      )}
    >
      {isIncome ? "+" : "−"} {formatRupiah(entry.amount)}
    </span>
  );
}

function ActorAvatar({ entry }: { entry: LedgerEntry }) {
  if (entry.actorRole === "Pengurus") {
    return (
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400"
      >
        <ShieldCheck className="h-4 w-4" />
      </span>
    );
  }
  return (
    <PersonAvatar
      name={entry.actor}
      anonymous={entry.anonymous}
      className="h-9 w-9 border border-green-200 text-sm dark:border-green-900"
    />
  );
}

/** Income and expenses of one fund, newest first (`/api/finance/transactions`). */
export function FinanceLedgerTable({ refreshKey }: { refreshKey: number }) {
  const [fund, setFund] = useState<ApiFundType>("IPL");
  const [page, setPage] = useState(1);
  const { entries, pagination, isLoading, error, reload } = useFundLedger(
    fund,
    page,
    PAGE_SIZE,
    refreshKey,
  );
  const totalPages = pagination?.totalPages ?? 1;

  function renderBody() {
    if (error) {
      return (
        <FinanceLoadError className="m-5" message={error} onRetry={reload} />
      );
    }

    if (isLoading && entries.length === 0) {
      return (
        <div role="status" className="space-y-3 p-5">
          <span className="sr-only">Memuat riwayat...</span>
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <p className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          Belum ada transaksi untuk dana ini.
        </p>
      );
    }

    return (
      <>
        {/* Desktop & tablet */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={adminTableHeadClass}>
                <th scope="col" className="px-5 py-3">
                  Tanggal
                </th>
                <th scope="col" className="px-4 py-3">
                  User / Petugas
                </th>
                <th scope="col" className="px-4 py-3">
                  Keterangan
                </th>
                <th scope="col" className="px-4 py-3">
                  Jenis
                </th>
                <th scope="col" className="px-5 py-3 text-right">
                  Nominal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap px-5 py-4 text-gray-500 dark:text-gray-400">
                    {formatShortDate(entry.date)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <ActorAvatar entry={entry} />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {entry.actor}
                        </p>
                        <p className="text-xs text-gray-400">
                          {entry.actorRole}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {entry.title}
                    </p>
                    {entry.detail && (
                      <p
                        className="mt-0.5 max-w-sm truncate text-xs text-gray-400"
                        title={entry.detail}
                      >
                        {entry.detail}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <TypeBadge type={entry.type} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <SignedAmount entry={entry} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <ul className="divide-y divide-gray-100 md:hidden dark:divide-slate-800">
          {entries.map((entry) => (
            <li key={entry.id} className="space-y-2 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <ActorAvatar entry={entry} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {entry.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {entry.actor} · {formatShortDate(entry.date)}
                    </p>
                  </div>
                </div>
                <SignedAmount entry={entry} />
              </div>
              {entry.detail && (
                <p className="break-words text-xs text-gray-500 dark:text-gray-400">
                  {entry.detail}
                </p>
              )}
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <section className={adminCardClass}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <NotebookText
              aria-hidden="true"
              className="h-5 w-5 text-green-600"
            />
            Riwayat Keuangan
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pemasukan warga dan pengeluaran pengurus dalam satu laporan.
          </p>
        </div>

        <div className="relative w-full sm:w-56">
          <label htmlFor="finance-ledger-fund" className="sr-only">
            Sumber dana
          </label>
          <select
            id="finance-ledger-fund"
            value={fund}
            onChange={(event) => {
              setFund(event.target.value as ApiFundType);
              setPage(1);
            }}
            className={cn(
              adminFieldClass,
              "appearance-none pr-9 font-semibold text-green-800 dark:text-green-300",
            )}
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

      <div
        aria-busy={isLoading}
        className="border-t border-gray-100 dark:border-gray-800"
      >
        {renderBody()}
      </div>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={pagination?.total ?? 0}
        unit="transaksi"
        onPageChange={setPage}
      />
    </section>
  );
}
