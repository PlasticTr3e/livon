import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { primaryButtonClass } from "./payment-styles";

type CheckoutEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
};

/** Shown when there is nothing valid to pay (bill already settled, bad amount). */
export function CheckoutEmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: CheckoutEmptyStateProps) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-green-200 bg-green-100 text-green-600 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
        <Icon aria-hidden="true" className="h-7 w-7" />
      </div>
      <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
      <Link href={actionHref} className={`${primaryButtonClass} mt-6`}>
        {actionLabel}
      </Link>
    </div>
  );
}
