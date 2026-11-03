import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { primaryButtonClass } from "@/components/payment/payment-styles";
import {
  formatBillingMonth,
  formatRupiah,
  IPL_MONTHLY_FEE,
  PAYMENT_ROUTES,
  type BillingPeriod,
} from "@/lib/payment/billing";

type IplPocketCardProps = {
  outstandingPeriods: BillingPeriod[];
  currentPeriod: BillingPeriod;
};

export function IplPocketCard({
  outstandingPeriods,
  currentPeriod,
}: IplPocketCardProps) {
  const isPaid = outstandingPeriods.length === 0;
  const amount = isPaid
    ? IPL_MONTHLY_FEE
    : outstandingPeriods.length * IPL_MONTHLY_FEE;
  const monthLabel =
    outstandingPeriods.length > 1
      ? `${outstandingPeriods.length} bulan`
      : formatBillingMonth(outstandingPeriods[0] ?? currentPeriod);

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm sm:p-8 dark:border-green-900/60 dark:from-green-950/40 dark:to-slate-900">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full border-[32px] border-green-100/80 dark:border-green-900/30"
      />

      <div className="relative flex items-start justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700 dark:text-green-400">
          Kewajiban bulanan
        </p>
        <Building2
          aria-hidden="true"
          className="h-7 w-7 text-green-700 dark:text-green-400"
        />
      </div>

      <h2 className="relative mt-5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
        Kantong pembayaran IPL
      </h2>
      <p className="relative mt-3 text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-400">
        Iuran {monthLabel} untuk keamanan, kebersihan, perawatan fasilitas, dan
        operasional lingkungan.
      </p>

      <div className="relative mt-6 flex items-end justify-between gap-3 border-y border-green-100 py-5 dark:border-slate-800">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tagihan otomatis
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums text-slate-900 dark:text-white">
            {formatRupiah(amount)}
          </p>
        </div>
        <span
          className={cn(
            "whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold",
            isPaid
              ? "bg-green-900 text-white dark:bg-green-800"
              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
          )}
        >
          {isPaid ? "Sudah dibayar" : "Belum dibayar"}
        </span>
      </div>

      <div className="relative mt-auto pt-6">
        {isPaid ? (
          <button
            type="button"
            disabled
            className={cn(
              primaryButtonClass,
              "disabled:bg-green-300 disabled:text-white dark:disabled:bg-green-900/60 dark:disabled:text-green-200",
            )}
          >
            Pembayaran selesai
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : (
          <Link
            href={PAYMENT_ROUTES.iplCheckout}
            className={primaryButtonClass}
          >
            Bayar IPL {formatRupiah(amount)}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        )}
      </div>
    </article>
  );
}
