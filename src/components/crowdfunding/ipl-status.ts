import { getDisplayLocale } from "@/lib/i18n/display";
import type { ResidentBillItem } from "@/lib/finance/finance-types";

export type IplBillState = "LUNAS" | "BELUM_BAYAR" | "TERLAMBAT" | "MENUNGGU";

const DAY = 86_400_000;

function endOfDay(date: string) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

/** Status yang dilihat warga: tagihan belum dibayar yang lewat jatuh tempo jadi "TERLAMBAT". */
export function getBillState(
  bill: ResidentBillItem,
  now = new Date(),
): IplBillState {
  if (bill.status === "LUNAS") return "LUNAS";
  if (bill.status === "MENUNGGU_VERIFIKASI") return "MENUNGGU";
  if (bill.dueDate && endOfDay(bill.dueDate) < now) return "TERLAMBAT";
  return "BELUM_BAYAR";
}

/** Positif = sisa hari sebelum jatuh tempo, negatif = sudah lewat berapa hari. */
export function getDaysUntilDue(dueDate: string, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / DAY);
}

export function formatPeriod(bill: Pick<ResidentBillItem, "month" | "year">) {
  return new Date(bill.year, bill.month - 1, 1).toLocaleDateString(
    getDisplayLocale(),
    {
      month: "long",
      year: "numeric",
    },
  );
}

export function formatLongDate(date: string) {
  return new Date(date).toLocaleDateString(getDisplayLocale(), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export type IplOverview = {
  state: IplBillState | "KOSONG";
  /** Tagihan yang paling perlu diperhatikan warga saat ini. */
  focus: ResidentBillItem | null;
  overdueCount: number;
};

export function getIplOverview(
  bills: ResidentBillItem[],
  now = new Date(),
): IplOverview {
  if (!bills.length) return { state: "KOSONG", focus: null, overdueCount: 0 };
  const byDue = [...bills].sort(
    (a, b) =>
      new Date(a.dueDate ?? a.createdAt).getTime() -
      new Date(b.dueDate ?? b.createdAt).getTime(),
  );
  const overdue = byDue.filter(
    (bill) => getBillState(bill, now) === "TERLAMBAT",
  );
  if (overdue.length)
    return {
      state: "TERLAMBAT",
      focus: overdue[0],
      overdueCount: overdue.length,
    };
  const unpaid = byDue.find(
    (bill) => getBillState(bill, now) === "BELUM_BAYAR",
  );
  if (unpaid) return { state: "BELUM_BAYAR", focus: unpaid, overdueCount: 0 };
  const waiting = byDue.find((bill) => bill.status === "MENUNGGU_VERIFIKASI");
  if (waiting) return { state: "MENUNGGU", focus: waiting, overdueCount: 0 };
  return { state: "LUNAS", focus: bills[0], overdueCount: 0 };
}
