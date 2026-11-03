"use client";

import { useEffect, useEffectEvent, useState } from "react";
import {
  FinanceApiError,
  getFinanceSummary,
  getFinanceTransactions,
  getResidentBills,
} from "@/lib/finance/finance-api";
import type {
  KpiCardsSummary,
  ResidentBillItem,
  TransactionListItem,
} from "@/lib/finance/finance-types";
import { toBillingPeriod, type BillingPeriod } from "./billing";

/**
 * Read hooks for the Billing & Care pages. All data comes from the existing
 * finance API (`/api/finance/*`) through `@/lib/finance/finance-api`.
 */

export type ApiFundType = "IPL" | "DONASI";

export const ANONYMOUS_DONOR = "Anonim";

type RemoteState<T> = {
  key: string;
  version: number;
  data?: T;
  error?: string;
};

function getLoadErrorMessage(error: unknown) {
  if (error instanceof FinanceApiError) {
    if (error.status === 401) return "Sesi Anda berakhir. Silakan masuk lagi.";
    if (error.status === 0) return "Tidak dapat terhubung ke server.";
  }
  return "Data keuangan gagal dimuat.";
}

/** Fetches once per `key` (null = skip) and keeps the last data while reloading. */
function useRemoteData<T>(key: string | null, fetcher: () => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<RemoteState<T> | null>(null);
  const runFetcher = useEffectEvent(fetcher);

  useEffect(() => {
    if (!key) return;

    let active = true;
    runFetcher().then(
      (data) => {
        if (active) setState({ key, version, data });
      },
      (error: unknown) => {
        if (active) {
          setState({ key, version, error: getLoadErrorMessage(error) });
        }
      },
    );

    return () => {
      active = false;
    };
  }, [key, version]);

  const sameKey = key !== null && state?.key === key;

  return {
    data: sameKey ? state.data : undefined,
    error: sameKey ? state.error : undefined,
    isLoading: key !== null && !(sameKey && state.version === version),
    reload: () => setVersion((value) => value + 1),
  };
}

/** The 4 KPI values plus the signed-in warga's latest bill. */
export function useFinanceSummary() {
  const result = useRemoteData<KpiCardsSummary>("summary", getFinanceSummary);
  return { ...result, summary: result.data };
}

export function useFundExpenses(fundType: ApiFundType, limit = 50) {
  const result = useRemoteData(`expenses:${fundType}:${limit}`, () =>
    getFinanceTransactions({ fundType, type: "PENGELUARAN", limit }),
  );

  return {
    ...result,
    expenses: result.data?.transactions ?? [],
    total: result.data?.pagination.total ?? 0,
  };
}

// --- Ledger (admin "Riwayat keuangan") ---------------------------------------

export type LedgerActorRole = "Warga" | "Donatur" | "Pengurus";

export type LedgerEntry = {
  id: string;
  date: string;
  actor: string;
  actorRole: LedgerActorRole;
  anonymous: boolean;
  title: string;
  detail: string | null;
  type: TransactionListItem["type"];
  amount: number;
};

/** `verifyResidentBill` titles IPL income as `Pembayaran <bill> (<warga>)`. */
const IPL_INCOME_TITLE = /^(.*)\s+\(([^()]+)\)$/;

function toLedgerEntry(item: TransactionListItem): LedgerEntry {
  const base = {
    id: item.id,
    date: item.transactionDate,
    type: item.type,
    amount: item.amount,
    anonymous: false,
  };

  if (item.type === "PENGELUARAN") {
    return {
      ...base,
      actor: item.recordedBy?.name || "Pengurus",
      actorRole: "Pengurus",
      title: item.title,
      detail: [item.category, item.description].filter(Boolean).join(" · "),
    };
  }

  if (item.fundType === "DONASI") {
    const donation = toDonationEntry(item);
    return {
      ...base,
      actor: donation.donor,
      actorRole: "Donatur",
      anonymous: donation.anonymous,
      title: "Donasi kas solidaritas",
      detail: donation.message ?? item.category,
    };
  }

  const match = IPL_INCOME_TITLE.exec(item.title);
  return {
    ...base,
    actor: match?.[2] ?? item.recordedBy?.name ?? "Warga",
    actorRole: "Warga",
    title: match?.[1] ?? item.title,
    detail: item.category,
  };
}

export function useFundLedger(
  fundType: ApiFundType,
  page: number,
  limit: number,
  revision = 0,
) {
  const key = `ledger:${fundType}:${page}:${limit}:${revision}`;
  const result = useRemoteData(key, () =>
    getFinanceTransactions({ fundType, page, limit }),
  );

  return {
    ...result,
    entries: (result.data?.transactions ?? []).map(toLedgerEntry),
    pagination: result.data?.pagination ?? null,
  };
}

// --- Donations ---------------------------------------------------------------

/** Labels written by `recordDonation` in the finance service. */
const API_DONATION_TITLE_PREFIX = "Donasi Kas Perumahan - ";
const API_ANONYMOUS_LABEL = "Hamba Allah";
const API_DEFAULT_NOTE_PREFIX = "Donasi untuk kas perumahan dari ";

/** Midtrans order id appended to the donation note so a payment is recorded once. */
const ORDER_REFERENCE = /\s*\[ref:([\w-]+)\]\s*$/;

export function buildDonationNote(message: string, orderId: string) {
  return `${message.trim()} [ref:${orderId}]`.trim();
}

export type DonationEntry = {
  id: string;
  donor: string;
  anonymous: boolean;
  message?: string;
  amount: number;
  date: string;
};

function toDonationEntry(item: TransactionListItem): DonationEntry {
  const label = item.title.startsWith(API_DONATION_TITLE_PREFIX)
    ? item.title.slice(API_DONATION_TITLE_PREFIX.length).trim()
    : item.recordedBy?.name || "Warga";
  const anonymous = label === API_ANONYMOUS_LABEL;
  const message = (item.description ?? "").replace(ORDER_REFERENCE, "").trim();

  return {
    id: item.id,
    donor: anonymous ? ANONYMOUS_DONOR : label,
    anonymous,
    message:
      message && !message.startsWith(API_DEFAULT_NOTE_PREFIX)
        ? message
        : undefined,
    amount: item.amount,
    date: item.transactionDate,
  };
}

export function useDonationFeed(limit = 5) {
  const result = useRemoteData(`donations:${limit}`, () =>
    getFinanceTransactions({ fundType: "DONASI", type: "PEMASUKAN", limit }),
  );

  return {
    ...result,
    donations: (result.data?.transactions ?? []).map(toDonationEntry),
    donationCount: result.data?.pagination.total ?? 0,
  };
}

// --- IPL bills ---------------------------------------------------------------

export type IplBill = {
  id: string;
  title: string;
  period: BillingPeriod;
  amount: number;
  status: ResidentBillItem["status"];
  dueDate: string | null;
};

export function getBillPeriod(bill: { month: number; year: number }) {
  return toBillingPeriod(new Date(bill.year, bill.month - 1, 1));
}

function toIplBill(bill: ResidentBillItem): IplBill {
  return {
    id: bill.id,
    title: bill.title,
    period: getBillPeriod(bill),
    amount: bill.amount,
    status: bill.status,
    dueDate: bill.dueDate,
  };
}

/** `Blok A No. 12`, or null when the warga has no address on file. */
export function formatResidentAddress(
  bill: Pick<ResidentBillItem, "blockHouse" | "houseNumber">,
) {
  const parts = [bill.blockHouse, bill.houseNumber].filter(Boolean);
  return parts.length ? parts.join(" No. ") : null;
}

function getResidenceLabel(bills: ResidentBillItem[]) {
  const withAddress = bills.find((bill) => formatResidentAddress(bill));
  return withAddress ? formatResidentAddress(withAddress) : null;
}

/** The signed-in warga's own bills. Pass `enabled=false` for other roles. */
export function useMyIplBills(enabled: boolean) {
  const result = useRemoteData(enabled ? "ipl-bills" : null, () =>
    getResidentBills({ limit: 100 }),
  );
  const raw = result.data?.bills ?? [];
  const bills = raw
    .map(toIplBill)
    .sort((a, b) => a.period.localeCompare(b.period));

  return {
    ...result,
    unpaidBills: bills.filter((bill) => bill.status === "BELUM_BAYAR"),
    awaitingBills: bills.filter(
      (bill) => bill.status === "MENUNGGU_VERIFIKASI",
    ),
    latestBill: bills.at(-1) ?? null,
    residenceLabel: getResidenceLabel(raw),
  };
}

// --- Admin -------------------------------------------------------------------

export type BillStatusFilter = ResidentBillItem["status"] | "ALL";

const BILLS_PAGE_LIMIT = 100;

/** Every bill the admin can see, across all API pages. */
async function fetchAllBills() {
  const first = await getResidentBills({ page: 1, limit: BILLS_PAGE_LIMIT });
  const pages = Array.from(
    { length: first.pagination.totalPages - 1 },
    (_, index) =>
      getResidentBills({ page: index + 2, limit: BILLS_PAGE_LIMIT }),
  );
  const rest = await Promise.all(pages);
  return [first, ...rest].flatMap((result) => result.bills);
}

/** Ids of users whose database role is WARGA (`GET /api/agency/citizens`). */
async function fetchWargaUserIds() {
  const token = localStorage.getItem("livon-token");
  let response: Response;
  try {
    response = await fetch("/api/agency/citizens", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
  } catch {
    throw new FinanceApiError("Unable to connect.", 0);
  }

  const result = (await response.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    data?: { id: string }[];
  } | null;
  if (!response.ok || result?.success !== true) {
    throw new FinanceApiError(
      result?.message || "Request failed.",
      response.status,
    );
  }

  return new Set((result.data ?? []).map((user) => user.id));
}

/**
 * IPL bills owned by WARGA accounts only (ADMIN view). The bill generator also
 * bills ADMIN/DEVELOPER accounts that have a citizen profile; those bills are
 * hidden here because only warga pay IPL.
 */
export function useAdminWargaBills(revision = 0) {
  const result = useRemoteData(`admin-warga-bills:${revision}`, async () => {
    const [bills, wargaIds] = await Promise.all([
      fetchAllBills(),
      fetchWargaUserIds(),
    ]);
    return bills.filter((bill) => wargaIds.has(bill.userId));
  });
  const bills = result.data ?? [];

  return {
    ...result,
    bills,
    awaitingCount: bills.filter((bill) => bill.status === "MENUNGGU_VERIFIKASI")
      .length,
    unpaidCount: bills.filter((bill) => bill.status === "BELUM_BAYAR").length,
  };
}
