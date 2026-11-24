import Link from "next/link";
import { ChevronRight, HandHeart, Users } from "lucide-react";
import { outlineButtonClass } from "@/components/payment/payment-styles";
import { formatCompactRupiah, PAYMENT_ROUTES } from "@/lib/payment/billing";

type DonationPocketCardProps = {
  balance: number;
  donationCount: number;
  isLoading?: boolean;
};

function ValueSkeleton() {
  return (
    <span className="mt-2 block h-7 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
  );
}

export function DonationPocketCard({
  balance,
  donationCount,
  isLoading = false,
}: DonationPocketCardProps) {
  return (
    <article
      aria-busy={isLoading}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
          Donasi sosial
        </p>
        <HandHeart
          aria-hidden="true"
          className="h-7 w-7 text-blue-600 dark:text-blue-400"
        />
      </div>

      <h2 className="mt-5 text-xl font-black tracking-tight text-slate-900 dark:text-white">
        Kantong solidaritas warga
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Dana bersama untuk bantuan darurat, warga lansia, dan kebutuhan sosial
        di lingkungan kita.
      </p>

      <dl className="mt-6 grid grid-cols-2 border-y border-slate-100 py-5 dark:border-slate-800">
        <div>
          <dt className="text-sm text-slate-500 dark:text-slate-400">
            Saldo kas
          </dt>
          {isLoading ? (
            <ValueSkeleton />
          ) : (
            <dd className="mt-1 text-xl font-black tabular-nums text-slate-900 sm:text-2xl dark:text-white">
              {formatCompactRupiah(balance)}
            </dd>
          )}
        </div>
        <div className="border-l border-slate-100 pl-4 sm:pl-6 dark:border-slate-800">
          <dt className="text-sm text-slate-500 dark:text-slate-400">
            Donasi masuk
          </dt>
          {isLoading ? (
            <ValueSkeleton />
          ) : (
            <dd className="mt-1 flex items-center gap-2 text-xl font-black text-slate-900 sm:text-2xl dark:text-white">
              <Users aria-hidden="true" className="h-5 w-5 text-blue-600" />
              {donationCount.toLocaleString("id-ID")}
            </dd>
          )}
        </div>
      </dl>

      <div className="mt-auto pt-6">
        <Link
          href={PAYMENT_ROUTES.donationDetail}
          className={outlineButtonClass}
        >
          Donasi sekarang
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
