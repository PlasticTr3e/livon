import Link from "next/link";
import { HandCoins } from "lucide-react";

export function CrowdfundingComingSoon({
  backHref = "/map",
}: {
  backHref?: string;
}) {
  return (
    <div className="flex h-full overflow-y-auto bg-slate-50 dark:bg-[#0B1120]">
      <div className="m-auto w-full max-w-lg px-6 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <HandCoins aria-hidden="true" className="h-8 w-8" />
        </div>
        <p className="mb-2 text-sm font-semibold text-green-700 dark:text-green-400">
          Community Funds
        </p>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white sm:text-4xl">
          Coming soon
        </h1>
        <p className="mt-3 text-base font-medium text-gray-700 dark:text-gray-300">
          Rework in progress
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          A new home for community donations and household dues, including IPL.
          Please check back later.
        </p>
        <Link
          href={backHref}
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-green-600 px-5 text-sm font-bold text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
        >
          Back to projects
        </Link>
      </div>
    </div>
  );
}
