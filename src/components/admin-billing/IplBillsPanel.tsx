"use client";

import { useState, type FormEvent } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Loader2,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import { AdminPagination } from "./AdminPagination";
import { FinanceLoadError } from "@/components/payment/FinanceLoadError";
import { PersonAvatar } from "@/components/payment/PersonAvatar";
import { useToast } from "@/components/shared/AppToaster";
import { cn } from "@/components/ui/primitives";
import {
  rejectResidentBill,
  verifyResidentBill,
} from "@/lib/finance/finance-api";
import type { ResidentBillItem } from "@/lib/finance/finance-types";
import {
  formatBillingPeriod,
  formatRupiah,
  formatShortDate,
  toBillingPeriod,
  type BillingPeriod,
} from "@/lib/payment/billing";
import {
  formatResidentAddress,
  getBillPeriod,
  type BillStatusFilter,
} from "@/lib/payment/finance-data";
import {
  adminCardClass,
  adminFieldClass,
  adminTableHeadClass,
} from "./admin-billing-styles";
import { IplBillStatusBadge } from "./IplBillStatusBadge";
import { IplRejectDialog } from "./IplRejectDialog";

const PAGE_SIZE = 10;
const PERIODS_AHEAD = 2;
const PERIODS_BACK = 12;

const STATUS_TABS: { value: BillStatusFilter; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "MENUNGGU_VERIFIKASI", label: "Perlu verifikasi" },
  { value: "BELUM_BAYAR", label: "Belum bayar" },
  { value: "LUNAS", label: "Lunas" },
];

/** Upcoming months first, then the past year. */
function getPeriodOptions(): BillingPeriod[] {
  const now = new Date();
  return Array.from({ length: PERIODS_AHEAD + PERIODS_BACK + 1 }, (_, index) =>
    toBillingPeriod(
      new Date(now.getFullYear(), now.getMonth() + PERIODS_AHEAD - index, 1),
    ),
  );
}

type IplBillsPanelProps = {
  /** WARGA-owned bills, already loaded by the page. */
  allBills: ResidentBillItem[];
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
  onChanged: () => void;
};

type BusyAction = { billId: string; kind: "verify" | "reject" } | null;

function getResidentName(bill: ResidentBillItem) {
  return bill.residentName || "Warga";
}

export function IplBillsPanel({
  allBills,
  isLoading,
  error,
  onRetry: reload,
  onChanged,
}: IplBillsPanelProps) {
  const toast = useToast();
  const [periodOptions] = useState(getPeriodOptions);
  const [period, setPeriod] = useState<BillingPeriod | "ALL">(() =>
    toBillingPeriod(new Date()),
  );
  const [status, setStatus] = useState<BillStatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [rejecting, setRejecting] = useState<ResidentBillItem | null>(null);

  const query = search.trim().toLowerCase();
  const filtered = allBills.filter(
    (bill) =>
      (status === "ALL" || bill.status === status) &&
      (period === "ALL" || getBillPeriod(bill) === period) &&
      (!query || getResidentName(bill).toLowerCase().includes(query)),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const bills = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function changeStatus(next: BillStatusFilter) {
    setStatus(next);
    setPage(1);
  }

  function changePeriod(next: BillingPeriod | "ALL") {
    setPeriod(next);
    setPage(1);
  }

  function changeSearch(next: string) {
    setSearch(next);
    setPage(1);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  async function handleVerify(bill: ResidentBillItem) {
    setBusy({ billId: bill.id, kind: "verify" });
    try {
      await verifyResidentBill(bill.id);
      toast.success(
        "Pembayaran diverifikasi",
        `Tagihan ${getResidentName(bill)} lunas dan saldo kas IPL bertambah.`,
      );
      onChanged();
    } catch (actionError) {
      toast.error(
        "Verifikasi gagal",
        actionError instanceof Error ? actionError.message : undefined,
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleReject(reason: string) {
    if (!rejecting) return;

    const bill = rejecting;
    setBusy({ billId: bill.id, kind: "reject" });
    try {
      await rejectResidentBill(bill.id, reason || undefined);
      toast.success(
        "Pembayaran ditolak",
        `Tagihan ${getResidentName(bill)} kembali berstatus belum bayar.`,
      );
      setRejecting(null);
      onChanged();
    } catch (actionError) {
      toast.error(
        "Penolakan gagal",
        actionError instanceof Error ? actionError.message : undefined,
      );
    } finally {
      setBusy(null);
    }
  }

  function renderActions(bill: ResidentBillItem) {
    const isBusy = busy?.billId === bill.id;
    const canReview = bill.status === "MENUNGGU_VERIFIKASI";

    if (!canReview && !bill.paymentProofUrl) {
      return (
        <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {bill.paymentProofUrl && (
          <a
            href={bill.paymentProofUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800"
          >
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            Bukti
          </a>
        )}
        {canReview && (
          <>
            <button
              type="button"
              onClick={() => void handleVerify(bill)}
              disabled={isBusy}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-green-600 px-3 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {isBusy && busy?.kind === "verify" ? (
                <Loader2
                  aria-hidden="true"
                  className="h-3.5 w-3.5 animate-spin"
                />
              ) : (
                <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
              )}
              Verifikasi
            </button>
            <button
              type="button"
              onClick={() => setRejecting(bill)}
              disabled={isBusy}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <XCircle aria-hidden="true" className="h-3.5 w-3.5" />
              Tolak
            </button>
          </>
        )}
      </div>
    );
  }

  function renderBody() {
    if (error) {
      return (
        <FinanceLoadError className="m-5" message={error} onRetry={reload} />
      );
    }

    if (isLoading && bills.length === 0) {
      return (
        <div role="status" className="space-y-3 p-5">
          <span className="sr-only">Memuat tagihan...</span>
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      );
    }

    if (bills.length === 0) {
      return (
        <p className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          {status === "MENUNGGU_VERIFIKASI"
            ? "Tidak ada pembayaran yang perlu diverifikasi."
            : "Belum ada tagihan untuk filter ini."}
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
                  Nama user
                </th>
                <th scope="col" className="px-4 py-3">
                  Blok / Alamat
                </th>
                <th scope="col" className="px-4 py-3">
                  Periode
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Nominal
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {bills.map((bill) => (
                <tr
                  key={bill.id}
                  className="transition-colors hover:bg-green-50/40 dark:hover:bg-green-900/10"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <PersonAvatar
                        name={getResidentName(bill)}
                        className="h-9 w-9 border border-green-200 text-sm dark:border-green-900"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {getResidentName(bill)}
                        </p>
                        {bill.notes && (
                          <p
                            className="mt-0.5 max-w-xs truncate text-xs text-gray-400"
                            title={bill.notes}
                          >
                            {bill.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-300">
                    {formatResidentAddress(bill) ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-gray-600 dark:text-gray-300">
                    {formatBillingPeriod(getBillPeriod(bill))}
                    {bill.dueDate && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        Jatuh tempo {formatShortDate(bill.dueDate)}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums text-gray-900 dark:text-white">
                    {formatRupiah(bill.amount)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <IplBillStatusBadge status={bill.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    {renderActions(bill)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <ul className="divide-y divide-gray-100 md:hidden dark:divide-slate-800">
          {bills.map((bill) => {
            const address = formatResidentAddress(bill);
            return (
              <li key={bill.id} className="space-y-3 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <PersonAvatar
                      name={getResidentName(bill)}
                      className="h-9 w-9 border border-green-200 text-sm dark:border-green-900"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {getResidentName(bill)}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {formatBillingPeriod(getBillPeriod(bill))}
                        {address ? ` · ${address}` : ""}
                      </p>
                    </div>
                  </div>
                  <IplBillStatusBadge status={bill.status} />
                </div>
                {bill.notes && (
                  <p className="break-words text-xs text-gray-500 dark:text-gray-400">
                    {bill.notes}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                    {formatRupiah(bill.amount)}
                  </span>
                  {renderActions(bill)}
                </div>
              </li>
            );
          })}
        </ul>
      </>
    );
  }

  return (
    <section className={adminCardClass}>
      <div className="space-y-4 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <Users aria-hidden="true" className="h-5 w-5 text-green-600" />
              Status Pembayaran IPL Warga
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Status pembayaran seluruh penghuni berdasarkan periode tagihan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-green-600"
            />
            <label htmlFor="ipl-bill-period" className="sr-only">
              Periode tagihan
            </label>
            <div className="relative w-full sm:w-48">
              <select
                id="ipl-bill-period"
                value={period}
                onChange={(event) => changePeriod(event.target.value)}
                className={cn(adminFieldClass, "appearance-none pr-9")}
              >
                <option value="ALL">Semua periode</option>
                {periodOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatBillingPeriod(option)}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Filter status tagihan"
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                onClick={() => changeStatus(tab.value)}
                className={cn(
                  "h-9 shrink-0 rounded-full border px-4 text-xs font-semibold transition",
                  status === tab.value
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-gray-200 text-gray-600 hover:border-green-300 dark:border-gray-700 dark:text-gray-300",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSearch}
            role="search"
            className="relative lg:w-72"
          >
            <label htmlFor="ipl-bill-search" className="sr-only">
              Cari nama warga
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              id="ipl-bill-search"
              type="search"
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Cari nama warga"
              className={cn(adminFieldClass, "h-10 pl-9")}
            />
          </form>
        </div>
      </div>

      <div
        aria-busy={isLoading}
        className="border-t border-gray-100 dark:border-gray-800"
      >
        {renderBody()}
      </div>

      <AdminPagination
        page={currentPage}
        totalPages={totalPages}
        total={filtered.length}
        unit="tagihan"
        onPageChange={setPage}
      />

      {rejecting && (
        <IplRejectDialog
          residentName={getResidentName(rejecting)}
          isSubmitting={busy?.kind === "reject"}
          onConfirm={(reason) => void handleReject(reason)}
          onClose={() => setRejecting(null)}
        />
      )}
    </section>
  );
}
