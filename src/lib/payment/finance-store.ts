"use client";

import { useSyncExternalStore } from "react";
import {
  getOutstandingPeriods,
  IPL_MONTHLY_FEE,
  shiftBillingPeriod,
  toBillingPeriod,
  type BillingPeriod,
  type CheckoutKind,
} from "./billing";

/**
 * Client-side ledger for IPL & donations. There is no backend for these funds
 * yet, so the state lives in localStorage and is shared across pages through
 * `useSyncExternalStore` (no provider needed).
 */

export type FundType = CheckoutKind;

export type Expenditure = {
  id: string;
  fund: FundType;
  description: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
};

export type FinanceTransaction = {
  id: string;
  fund: FundType;
  user: string;
  description: string;
  amount: number;
  date: string;
  message?: string;
  anonymous?: boolean;
  periods?: BillingPeriod[];
  paymentMethod?: string;
};

type FinanceState = {
  iplIncome: number;
  donationIncome: number;
  donationCount: number;
  iplPaidThrough: BillingPeriod;
  expenditures: Expenditure[];
  transactions: FinanceTransaction[];
};

export type RecordPaymentInput = {
  orderId: string;
  fund: FundType;
  amount: number;
  user: string;
  anonymous?: boolean;
  message?: string;
  periods?: BillingPeriod[];
  paymentMethod?: string;
};

const STORAGE_KEY = "livon-finance-v5";
export const ANONYMOUS_DONOR = "Anonim";

function daysAgoAt(days: number, hours: number, minutes: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

/** A day in the current month, capped at today so no expense is dated in the future. */
function monthDay(day: number) {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    Math.min(day, now.getDate()),
    12,
  ).toISOString();
}

function createDefaultState(): FinanceState {
  const lastMonth = shiftBillingPeriod(toBillingPeriod(new Date()), -1);

  return {
    iplIncome: 96_000_000,
    donationIncome: 41_500_000,
    donationCount: 184,
    iplPaidThrough: lastMonth,
    expenditures: [
      {
        id: "EXP-01",
        fund: "ipl",
        description: "Jasa keamanan lingkungan",
        category: "Keamanan",
        amount: 4_800_000,
        date: monthDay(5),
        note: "Honor 4 petugas keamanan",
      },
      {
        id: "EXP-02",
        fund: "ipl",
        description: "Pengangkutan sampah",
        category: "Kebersihan",
        amount: 2_250_000,
        date: monthDay(8),
        note: "Operasional bulanan",
      },
      {
        id: "EXP-03",
        fund: "ipl",
        description: "Perawatan pompa air",
        category: "Fasilitas",
        amount: 1_600_000,
        date: monthDay(12),
      },
      {
        id: "EXP-04",
        fund: "donation",
        description: "Paket sembako warga lansia",
        category: "Bantuan sosial",
        amount: 3_750_000,
        date: monthDay(10),
        note: "25 paket bantuan",
      },
      {
        id: "EXP-05",
        fund: "donation",
        description: "Dana darurat keluarga Ibu Rini",
        category: "Dana darurat",
        amount: 2_500_000,
        date: monthDay(16),
      },
    ],
    transactions: [
      {
        id: "TRX-DON-SEED-1",
        fund: "donation",
        user: "Rangga Pratama",
        description: "Donasi sosial warga",
        amount: 500_000,
        date: daysAgoAt(0, 9, 42),
        message: "Semoga bermanfaat untuk tetangga yang membutuhkan.",
      },
      {
        id: "TRX-DON-SEED-2",
        fund: "donation",
        user: ANONYMOUS_DONOR,
        anonymous: true,
        description: "Donasi sosial warga",
        amount: 250_000,
        date: daysAgoAt(1, 18, 15),
        message: "Sedikit dari kami, semoga berarti.",
      },
      {
        id: "TRX-IPL-SEED-1",
        fund: "ipl",
        user: "Budi Santoso",
        description: "Pembayaran IPL",
        amount: IPL_MONTHLY_FEE,
        date: daysAgoAt(1, 10, 5),
      },
      {
        id: "TRX-IPL-SEED-2",
        fund: "ipl",
        user: "Siti Maharani",
        description: "Pembayaran IPL",
        amount: IPL_MONTHLY_FEE,
        date: daysAgoAt(2, 8, 30),
      },
      {
        id: "TRX-DON-SEED-3",
        fund: "donation",
        user: "Maya & keluarga",
        description: "Donasi sosial warga",
        amount: 1_000_000,
        date: daysAgoAt(14, 16, 0),
      },
    ],
  };
}

let defaultStateCache: { day: string; state: FinanceState } | null = null;
let cachedState: FinanceState | null = null;
const listeners = new Set<() => void>();

/** Seed data cached per day so server and client render the same snapshot. */
function getDefaultState() {
  const day = new Date().toDateString();
  if (defaultStateCache?.day !== day) {
    defaultStateCache = { day, state: createDefaultState() };
  }
  return defaultStateCache.state;
}

function readState(): FinanceState {
  if (cachedState) return cachedState;

  const fallback = getDefaultState();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    cachedState = saved
      ? { ...fallback, ...(JSON.parse(saved) as Partial<FinanceState>) }
      : fallback;
  } catch {
    cachedState = fallback;
  }

  return cachedState;
}

function writeState(next: FinanceState) {
  cachedState = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode); keep the in-memory state.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY) return;
    cachedState = null;
    listener();
  }

  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

/** Records a settled payment once per Midtrans order id. */
export function recordPayment(input: RecordPaymentInput) {
  const current = readState();
  if (current.transactions.some((item) => item.id === input.orderId)) return;

  const isIpl = input.fund === "ipl";
  const lastPeriod = input.periods?.at(-1);

  writeState({
    ...current,
    iplIncome: isIpl ? current.iplIncome + input.amount : current.iplIncome,
    donationIncome: isIpl
      ? current.donationIncome
      : current.donationIncome + input.amount,
    donationCount: isIpl ? current.donationCount : current.donationCount + 1,
    iplPaidThrough:
      isIpl && lastPeriod && lastPeriod > current.iplPaidThrough
        ? lastPeriod
        : current.iplPaidThrough,
    transactions: [
      {
        id: input.orderId,
        fund: input.fund,
        user: input.anonymous ? ANONYMOUS_DONOR : input.user,
        anonymous: input.anonymous,
        description: isIpl ? "Pembayaran IPL" : "Donasi sosial warga",
        amount: input.amount,
        date: new Date().toISOString(),
        message: input.message || undefined,
        periods: input.periods,
        paymentMethod: input.paymentMethod,
      },
      ...current.transactions,
    ],
  });
}

function sumAmounts(items: { amount: number }[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}

export function useFinance() {
  const state = useSyncExternalStore(subscribe, readState, getDefaultState);
  const currentPeriod = toBillingPeriod(new Date());

  const byFund = (fund: FundType) =>
    state.expenditures.filter((item) => item.fund === fund);

  return {
    ...state,
    currentPeriod,

    iplBalance: state.iplIncome - sumAmounts(byFund("ipl")),
    donationBalance: state.donationIncome - sumAmounts(byFund("donation")),
    monthExpense: sumAmounts(
      state.expenditures.filter(
        (item) => toBillingPeriod(new Date(item.date)) === currentPeriod,
      ),
    ),
    outstandingIplPeriods: getOutstandingPeriods(state.iplPaidThrough),
    donations: state.transactions.filter((item) => item.fund === "donation"),
    expendituresByFund: byFund,
  };
}
