import { Users } from "lucide-react";
import { FinanceLoadError } from "@/components/payment/FinanceLoadError";
import { sectionCardClass } from "@/components/payment/payment-styles";
import { PersonAvatar } from "@/components/payment/PersonAvatar";
import { formatActivityTime, formatRupiah } from "@/lib/payment/billing";
import type { DonationEntry } from "@/lib/payment/finance-data";

type RecentDonorsListProps = {
  donations: DonationEntry[];
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
};

function DonorSkeleton() {
  return (
    <ul aria-hidden="true" className="mt-4 space-y-4">
      {[0, 1, 2].map((row) => (
        <li key={row} className="flex items-center gap-3">
          <span className="h-10 w-10 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          <span className="h-4 flex-1 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </li>
      ))}
    </ul>
  );
}

export function RecentDonorsList({
  donations,
  isLoading = false,
  error,
  onRetry,
}: RecentDonorsListProps) {
  function renderBody() {
    if (error && onRetry) {
      return (
        <FinanceLoadError className="mt-4" message={error} onRetry={onRetry} />
      );
    }
    if (isLoading) return <DonorSkeleton />;
    if (donations.length === 0) {
      return (
        <p className="mt-4 text-sm text-slate-500">
          Belum ada donasi. Jadilah donatur pertama.
        </p>
      );
    }

    return (
      <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
        {donations.map((donation) => (
          <li
            key={donation.id}
            className="flex items-start justify-between gap-4 py-4"
          >
            <div className="flex min-w-0 gap-3">
              <PersonAvatar
                name={donation.donor}
                anonymous={donation.anonymous}
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {donation.donor}
                </p>
                {donation.message && (
                  <p className="mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {donation.message}
                  </p>
                )}
                <p className="mt-1 font-mono text-[10px] text-slate-400">
                  {formatActivityTime(donation.date)}
                </p>
              </div>
            </div>
            <span className="whitespace-nowrap text-sm font-extrabold text-green-700 dark:text-green-300">
              {formatRupiah(donation.amount)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section aria-busy={isLoading} className={sectionCardClass}>
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
        <Users aria-hidden="true" className="h-5 w-5 text-green-600" />
        Donatur terbaru
      </h2>
      {renderBody()}
    </section>
  );
}
