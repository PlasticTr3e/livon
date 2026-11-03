import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import {
  getPaymentWidthClass,
  type PaymentPageWidth,
} from "./PaymentPageShell";

const badges = {
  secure: { icon: ShieldCheck, label: "Pembayaran aman" },
  encrypted: { icon: LockKeyhole, label: "Terenkripsi" },
} as const;

type PaymentSubHeaderProps = {
  backHref: string;
  badge: keyof typeof badges;
  width?: PaymentPageWidth;
};

/** Sticky "Kembali" bar shown above donation and checkout pages. */
export function PaymentSubHeader({
  backHref,
  badge,
  width = "default",
}: PaymentSubHeaderProps) {
  const { icon: Icon, label } = badges[badge];

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur sm:px-5 sm:py-3 dark:border-slate-800 dark:bg-slate-900/95">
      <div
        className={cn(
          "mx-auto flex items-center justify-between gap-4",
          getPaymentWidthClass(width),
        )}
      >
        <Link
          href={backHref}
          className="-ml-2 flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold text-slate-700 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 dark:text-slate-300 dark:hover:text-emerald-400"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Kembali
        </Link>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Icon aria-hidden="true" className="h-4 w-4" />
          {label}
        </span>
      </div>
    </header>
  );
}
