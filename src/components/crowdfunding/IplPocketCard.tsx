"use client";

import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { primaryButtonClass } from "@/components/payment/payment-styles";
import { formatRupiah, PAYMENT_ROUTES } from "@/lib/payment/billing";
import type { ResidentBillItem } from "@/lib/finance/finance-types";

type IplPocketCardProps = {
  bills: ResidentBillItem[];
  total: number;
  outstanding: { amount: number; count: number };
};

export function IplPocketCard({
  bills,
  total,
  outstanding,
}: IplPocketCardProps) {
  const { t: translateUi } = useLanguage();

  const nextBill = bills.find((bill) => bill.status === "BELUM_BAYAR");
  const isPaid = total > 0 && outstanding.count === 0;
  const status = !total
    ? "Belum ada tagihan"
    : isPaid
      ? "Sudah dibayar"
      : "Belum dibayar";
  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm sm:p-8 dark:border-green-900/60 dark:from-green-950/40 dark:to-slate-900">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full border-[32px] border-green-100/80 dark:border-green-900/30"
      />
      <div className="relative flex items-start justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700 dark:text-green-400">
          {translateUi("Kewajiban bulanan")}
        </p>
        <Building2
          aria-hidden="true"
          className="h-7 w-7 text-green-700 dark:text-green-400"
        />
      </div>
      <h2 className="relative mt-5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
        {translateUi("Kantong pembayaran IPL")}
      </h2>
      <p className="relative mt-3 text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-400">
        {translateUi(
          "Iuran untuk keamanan, kebersihan, perawatan fasilitas, dan operasional lingkungan.",
        )}
      </p>
      <div className="relative mt-6 flex flex-wrap items-end justify-between gap-3 border-y border-green-100 py-5 dark:border-slate-800">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {translateUi("Total belum lunas")}
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums text-slate-900 dark:text-white">
            {formatRupiah(outstanding.amount)}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            isPaid
              ? "bg-green-900 text-white dark:bg-green-800"
              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
          )}
        >
          {translateUi(status)}
        </span>
      </div>
      <div className="relative mt-auto pt-6">
        {nextBill ? (
          <Link
            href={PAYMENT_ROUTES.iplCheckout + "?bill=" + nextBill.id}
            className={primaryButtonClass}
          >
            {translateUi("Bayar IPL ")}
            {formatRupiah(nextBill.amount)}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        ) : outstanding.count ? (
          <a href="#my-bills" className={primaryButtonClass}>
            {translateUi("Lihat tagihan saya")}
          </a>
        ) : (
          <button
            type="button"
            disabled
            className={cn(
              primaryButtonClass,
              "disabled:bg-green-300 disabled:text-green-950 dark:disabled:bg-green-900/60 dark:disabled:text-green-200",
            )}
          >
            {isPaid
              ? translateUi("Pembayaran selesai")
              : translateUi("Belum ada tagihan")}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  );
}
