import { Users } from "lucide-react";
import { sectionCardClass } from "@/components/payment/payment-styles";
import { PersonAvatar } from "@/components/payment/PersonAvatar";
import { formatActivityTime, formatRupiah } from "@/lib/payment/billing";
import type { FinanceTransaction } from "@/lib/payment/finance-store";

type RecentDonorsListProps = {
  donations: FinanceTransaction[];
  limit?: number;
};

export function RecentDonorsList({
  donations,
  limit = 5,
}: RecentDonorsListProps) {
  const items = donations.slice(0, limit);

  return (
    <section className={sectionCardClass}>
      <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
        <Users aria-hidden="true" className="h-5 w-5 text-green-600" />
        Donatur terbaru
      </h2>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Jadilah donatur pertama bulan ini.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((donor) => (
            <li
              key={donor.id}
              className="flex items-start justify-between gap-4 py-4"
            >
              <div className="flex min-w-0 gap-3">
                <PersonAvatar name={donor.user} anonymous={donor.anonymous} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {donor.user}
                  </p>
                  {donor.message && (
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {donor.message}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-[10px] text-slate-400">
                    {formatActivityTime(donor.date)}
                  </p>
                </div>
              </div>
              <span className="whitespace-nowrap text-sm font-extrabold text-green-700 dark:text-green-300">
                {formatRupiah(donor.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
