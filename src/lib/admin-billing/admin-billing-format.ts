import { getDisplayLocale, translateDisplay } from "@/lib/i18n/display";
import type { IplPaymentCategory } from "./admin-billing-types";

export const CATEGORY_META: Record<
  IplPaymentCategory,
  { label: string; color: string; pill: string; dot: string }
> = {
  TEPAT_WAKTU: {
    label: "Tepat waktu",
    color: "#16a34a",
    pill: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950 dark:text-green-300",
    dot: "bg-green-500",
  },
  TERLAMBAT: {
    label: "Telat bayar",
    color: "#eab308",
    pill: "bg-yellow-50 text-yellow-800 ring-yellow-600/30 dark:bg-yellow-950 dark:text-yellow-300",
    dot: "bg-yellow-500",
  },
  MENUNGGU: {
    label: "Menunggu verifikasi",
    color: "#3b82f6",
    pill: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  NUNGGAK: {
    label: "Lewat deadline",
    color: "#dc2626",
    pill: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-300",
    dot: "bg-red-500",
  },
  BELUM_JATUH_TEMPO: {
    label: "Belum jatuh tempo",
    color: "#94a3b8",
    pill: "bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-400",
  },
};

export const CATEGORY_ORDER: IplPaymentCategory[] = [
  "TEPAT_WAKTU",
  "TERLAMBAT",
  "MENUNGGU",
  "NUNGGAK",
  "BELUM_JATUH_TEMPO",
];

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Virtual Account",
  echannel: "Mandiri Bill",
  qris: "QRIS",
  gopay: "GoPay",
  shopeepay: "ShopeePay",
  credit_card: "Kartu kredit",
  cstore: "Gerai retail",
  transfer_manual: "Transfer manual",
  demo: "Demo",
};

const BANK_LABELS: Record<string, string> = {
  bca: "BCA",
  bni: "BNI",
  bri: "BRI",
  mandiri: "Mandiri",
  permata: "Permata",
  cimb: "CIMB Niaga",
  gopay: "GoPay",
  shopeepay: "ShopeePay",
  qris: "QRIS",
};

export function methodLabel(method: string | null) {
  if (!method) return "-";
  return translateDisplay(METHOD_LABELS[method] ?? method.replace(/_/g, " "));
}

export function bankLabel(bank: string | null) {
  if (!bank) return "-";
  return BANK_LABELS[bank.toLowerCase()] ?? bank.toUpperCase();
}

export function rupiah(amount: number) {
  return `Rp ${Math.round(amount).toLocaleString(getDisplayLocale())}`;
}

export function shortDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(getDisplayLocale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function dateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString(getDisplayLocale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function periodLabel(period: string) {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(getDisplayLocale(), {
    month: "long",
    year: "numeric",
  });
}

export function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function todayInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

/** First and last day (YYYY-MM-DD) of a YYYY-MM period. */
export function monthBounds(period: string) {
  const [year, month] = period.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    first: `${period}-01`,
    last: `${period}-${String(lastDay).padStart(2, "0")}`,
  };
}
